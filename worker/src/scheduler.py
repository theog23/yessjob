"""
Loop principal del worker.

Cada ciclo:
1. Lee targets activos (usuarios x plataforma x sector).
2. Agrupa por (platform, sector) para no scrapear lo mismo N veces.
3. Corre el scraper de cada grupo y guarda jobs en scraped_jobs.
4. Para cada usuario y cada job del grupo, aplica filtros (keywords,
   excluded, min_budget) y si matchea y no fue notificado antes, envia
   por Telegram y registra notification_sent.

Manejo de fallos:
- Scraping: cada scraper devuelve (jobs, tuvo_error). Se trackea cuantos
  ciclos consecutivos fallo cada grupo (platform, categoria/skills) para
  advertir si hay un bloqueo o cambio de contrato sostenido, sin frenar
  el resto del sistema.
- Notificacion: send_job() distingue error permanente (bot bloqueado,
  chat invalido) de transitorio. Ante error permanente se desvincula al
  usuario automaticamente. Ante fallos transitorios repetidos para el
  mismo chat (>= _CHAT_FAILURE_LIMIT seguidos) se trata igual que un
  error permanente, para no reintentar por siempre un chat roto.

Heartbeat: al final de cada ciclo, si paso mas de HEARTBEAT_INTERVAL desde
la ultima notificacion real (o heartbeat) de un chat, se manda un aviso de
"sin novedades" — asi el usuario sabe que el sistema sigue vivo aunque no
haya matches.
"""
import asyncio
import logging
import random
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from telegram import Bot

from src import db
from src.matching import matches_filter
from src.scrapers import workana, freelancer, upwork
from src.translator import translate_job
from src.notifier import send_heartbeat, send_job, SendResult

logger = logging.getLogger(__name__)

_CONSECUTIVE_FAILURE_WARN_THRESHOLD = 5
_CHAT_FAILURE_LIMIT = 5
HEARTBEAT_INTERVAL = timedelta(hours=1)
_DEFAULT_INTERVAL_MIN = 60

_group_failure_streak: dict[tuple, int] = {}
_chat_failure_streak: dict[int, int] = {}
_group_last_scraped: dict[tuple, datetime] = {}


def _group_due(key: tuple, group_targets: list[dict], now: datetime) -> bool:
    """
    Un grupo solo se scrapea si paso su intervalo minimo (el mas exigente
    entre los planes de sus usuarios). Antes se scrapeaba cada grupo en
    cada tick del loop (60s) sin importar el plan — esto respeta la
    frecuencia real prometida (Free=60min, Pro=15min, Premium=5min) y de
    paso evita golpear plataformas externas mucho mas seguido de lo
    necesario.
    """
    interval_min = min(
        (t.get("min_scrape_interval") or _DEFAULT_INTERVAL_MIN) for t in group_targets
    )
    last = _group_last_scraped.get(key)
    return last is None or now - last >= timedelta(minutes=interval_min)


def _group_targets(targets: list[dict]) -> dict[tuple, list[dict]]:
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for t in targets:
        platform = t["platform"]
        if platform == "workana":
            key = ("workana", t.get("workana_category") or "it-programming")
        elif platform == "freelancer":
            skills = tuple(sorted(t.get("freelancer_skill_ids") or []))
            key = ("freelancer", skills)
        else:
            # Upwork no soporta filtro de categoria/skill en su busqueda
            # publica: todos los usuarios de Upwork comparten un unico
            # scrape por ciclo, sin importar el sector que hayan elegido.
            key = ("upwork", "all")
        groups[key].append(t)
    return groups


def _scrape_group(key: tuple) -> list[dict]:
    platform = key[0]
    try:
        if platform == "workana":
            jobs, had_error = workana.scrape(key[1])
        elif platform == "freelancer":
            jobs, had_error = freelancer.scrape(list(key[1]))
        elif platform == "upwork":
            jobs, had_error = upwork.scrape()
        else:
            return []
    except Exception as e:
        logger.exception("Scraper %s fallo inesperado: %s", platform, e)
        jobs, had_error = [], True

    if had_error:
        streak = _group_failure_streak.get(key, 0) + 1
        _group_failure_streak[key] = streak
        if streak >= _CONSECUTIVE_FAILURE_WARN_THRESHOLD:
            logger.error(
                "%s lleva %d ciclos consecutivos fallando — posible bloqueo o "
                "cambio de contrato del endpoint (grupo=%s)",
                platform, streak, key,
            )
    else:
        _group_failure_streak[key] = 0

    return jobs


def _job_matches(job: dict, target: dict) -> bool:
    keywords = target.get("keywords") or []
    excluded = target.get("excluded_keywords") or []
    min_budget = float(target.get("min_budget_usd") or 0)
    return matches_filter(job, keywords, excluded, min_budget)


async def _handle_send_result(result: SendResult, user_id: str, chat_id: int, job_id: str, platform: str) -> None:
    if result == SendResult.OK:
        _chat_failure_streak[chat_id] = 0
        db.mark_notified(user_id, job_id)
        db.log_usage(user_id, "notification_sent", {"platform": platform, "job_id": job_id})
        db.touch_activity(user_id)   # resetea el reloj del heartbeat
        await asyncio.sleep(0.4)   # rate-limit basico
        return

    if result == SendResult.PERMANENT_ERROR:
        db.mark_notified(user_id, job_id)   # no reintentar este job
        db.unlink_telegram(user_id)
        _chat_failure_streak.pop(chat_id, None)
        return

    # TRANSIENT_ERROR: no se marca notified, se reintenta el proximo ciclo,
    # pero si el mismo chat falla muchas veces seguidas dejamos de insistir.
    streak = _chat_failure_streak.get(chat_id, 0) + 1
    _chat_failure_streak[chat_id] = streak
    if streak >= _CHAT_FAILURE_LIMIT:
        logger.error(
            "Chat %s fallo %d veces seguidas (transitorio) — se desvincula para "
            "no reintentar indefinidamente", chat_id, streak,
        )
        db.mark_notified(user_id, job_id)
        db.unlink_telegram(user_id)
        _chat_failure_streak.pop(chat_id, None)


async def _send_due_heartbeats(bot: Bot, targets: list[dict]) -> None:
    # Un usuario puede aparecer varias veces en targets (una fila por
    # filtro). Para el heartbeat alcanza con uno por chat.
    chats: dict[int, str] = {t["chat_id"]: t["user_id"] for t in targets}
    now = datetime.now(timezone.utc)

    for chat_id, user_id in chats.items():
        last_activity = db.get_last_activity(user_id)
        if last_activity is None or now - last_activity < HEARTBEAT_INTERVAL:
            continue

        result = await send_heartbeat(bot, chat_id)
        if result == SendResult.OK:
            db.touch_activity(user_id)
        elif result == SendResult.PERMANENT_ERROR:
            db.unlink_telegram(user_id)
        # TRANSIENT_ERROR: no se toca nada, se reintenta el proximo ciclo.


async def run_cycle(bot: Bot) -> None:
    targets = db.get_active_user_platforms()
    if not targets:
        logger.info("Sin targets activos en este ciclo")
        return

    groups = _group_targets(targets)
    logger.info("Ciclo: %d targets en %d grupos", len(targets), len(groups))
    now = datetime.now(timezone.utc)

    for key, group_targets in groups.items():
        if not _group_due(key, group_targets, now):
            continue
        _group_last_scraped[key] = now

        jobs = _scrape_group(key)
        if not jobs:
            continue

        for job in jobs:
            job_id = db.upsert_job(job)
            if not job_id:
                continue

            if key[0] in ("freelancer", "upwork"):
                job = translate_job(job)

            for t in group_targets:
                if not _job_matches(job, t):
                    continue
                if db.was_notified(t["user_id"], job_id):
                    continue
                result = await send_job(bot, t["chat_id"], job, job_id)
                await _handle_send_result(result, t["user_id"], t["chat_id"], job_id, key[0])

    await _send_due_heartbeats(bot, targets)


async def loop_forever(bot: Bot, min_seconds: int, max_seconds: int) -> None:
    """
    Duerme un tiempo aleatorio entre min_seconds y max_seconds entre cada
    chequeo (en vez de un intervalo fijo), para no dejar un patron de
    trafico perfectamente regular. Esto es independiente del intervalo
    real de scraping por grupo (_group_due), que sigue respetando el
    plan de cada usuario -- esto solo afecta cada cuanto se hace el
    chequeo de "a quien le toca ahora".
    """
    logger.info("Loop de scraping cada %d-%ds (aleatorio)", min_seconds, max_seconds)
    while True:
        try:
            await run_cycle(bot)
        except Exception as e:
            logger.exception("Error en ciclo: %s", e)
        await asyncio.sleep(random.uniform(min_seconds, max_seconds))
