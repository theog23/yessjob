"""
Loop principal del worker.

Cada ciclo:
1. Lee targets activos (usuarios x plataforma x sector).
2. Agrupa por (platform, sector) para no scrapear lo mismo N veces.
3. Corre el scraper de cada grupo y guarda jobs en scraped_jobs.
4. Para cada usuario y cada job del grupo, aplica filtros (keywords,
   excluded, min_budget) y si matchea y no fue notificado antes, envia
   por Telegram y registra notification_sent.
"""
import asyncio
import logging
from collections import defaultdict

from telegram import Bot

from src import db
from src.scrapers import workana, freelancer
from src.translator import translate_job
from src.notifier import send_job

logger = logging.getLogger(__name__)


def _group_targets(targets: list[dict]) -> dict[tuple, list[dict]]:
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for t in targets:
        platform = t["platform"]
        if platform == "workana":
            key = ("workana", t.get("workana_category") or "it-programming")
        else:
            skills = tuple(sorted(t.get("freelancer_skill_ids") or []))
            key = ("freelancer", skills)
        groups[key].append(t)
    return groups


def _scrape_group(key: tuple) -> list[dict]:
    platform = key[0]
    try:
        if platform == "workana":
            return workana.scrape(key[1])
        if platform == "freelancer":
            return freelancer.scrape(list(key[1]))
    except Exception as e:
        logger.exception("Scraper %s fallo: %s", platform, e)
    return []


def _job_matches(platform: str, job: dict, target: dict) -> bool:
    keywords = target.get("keywords") or []
    excluded = target.get("excluded_keywords") or []
    min_budget = float(target.get("min_budget_usd") or 0)
    if platform == "workana":
        return workana.matches_filter(job, keywords, excluded, min_budget)
    return freelancer.matches_filter(job, keywords, excluded, min_budget)


async def run_cycle(bot: Bot) -> None:
    targets = db.get_active_user_platforms()
    if not targets:
        logger.info("Sin targets activos en este ciclo")
        return

    groups = _group_targets(targets)
    logger.info("Ciclo: %d targets en %d grupos", len(targets), len(groups))

    for key, group_targets in groups.items():
        jobs = _scrape_group(key)
        if not jobs:
            continue

        for job in jobs:
            job_id = db.upsert_job(job)
            if not job_id:
                continue

            if key[0] == "freelancer":
                job = translate_job(job)

            for t in group_targets:
                if not _job_matches(key[0], job, t):
                    continue
                if db.was_notified(t["user_id"], job_id):
                    continue
                ok = await send_job(bot, t["chat_id"], job, job_id)
                if ok:
                    db.mark_notified(t["user_id"], job_id)
                    db.log_usage(t["user_id"], "notification_sent",
                                 {"platform": key[0], "job_id": job_id})
                    await asyncio.sleep(0.4)   # rate-limit basico


async def loop_forever(bot: Bot, interval_seconds: int) -> None:
    logger.info("Loop de scraping cada %ds", interval_seconds)
    while True:
        try:
            await run_cycle(bot)
        except Exception as e:
            logger.exception("Error en ciclo: %s", e)
        await asyncio.sleep(interval_seconds)
