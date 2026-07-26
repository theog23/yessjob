"""
Formatea y envia notificaciones de jobs (y heartbeats de "sin novedades")
a cada usuario en Telegram.
"""
import logging
from enum import Enum

from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.error import BadRequest, Forbidden, TelegramError

logger = logging.getLogger(__name__)

HEARTBEAT_TEXT = (
    "Sin novedades en la ultima hora — seguimos vigilando tus filtros. "
    "Te aviso apenas aparezca algo nuevo."
)


class SendResult(Enum):
    OK = "ok"
    TRANSIENT_ERROR = "transient_error"   # reintentar en el proximo ciclo
    PERMANENT_ERROR = "permanent_error"   # no tiene sentido reintentar


def _truncate(s: str, n: int) -> str:
    if not s:
        return ""
    if len(s) <= n:
        return s
    return s[:n].rsplit(" ", 1)[0] + "..."


def format_job(job: dict) -> str:
    platform = job.get("platform", "?").upper()
    title = _truncate(job.get("title", ""), 200)
    desc  = _truncate(job.get("description", ""), 450)

    lines = [
        f"NUEVO PROYECTO - {platform}",
        "",
        f"Presupuesto: {job.get('budget_str') or 'No especificado'}",
    ]
    bid = (job.get("raw") or {}).get("bid_count")
    if bid is not None:
        lines.append(f"Propuestas: {bid}")
    skills = ", ".join((job.get("skills") or [])[:6]) or "No especificadas"
    lines.append(f"Skills: {skills}")
    lines.append("")
    lines.append("-----------------------------")
    lines.append(f"{title}")
    lines.append("")
    lines.append(desc)

    if job.get("needs_translation") and job.get("title_es"):
        lines.append("")
        lines.append("-----------------------------")
        lines.append("TRADUCCION (ES)")
        lines.append(_truncate(job["title_es"], 200))
        lines.append("")
        lines.append(_truncate(job.get("description_es", ""), 450))

    return "\n".join(lines)


def build_keyboard(job_id: str, url: str) -> InlineKeyboardMarkup:
    rows = []
    if url:
        rows.append([InlineKeyboardButton("Abrir proyecto", url=url)])
    rows.append([InlineKeyboardButton("Generar propuesta IA", callback_data=f"propose:{job_id}")])
    return InlineKeyboardMarkup(rows)


_PERMANENT_BAD_REQUEST_MARKERS = ("chat not found", "user is deactivated", "peer_id_invalid")


async def _send(bot: Bot, chat_id: int, text: str, reply_markup: InlineKeyboardMarkup | None = None) -> SendResult:
    try:
        await bot.send_message(
            chat_id=chat_id,
            text=text,
            reply_markup=reply_markup,
            disable_web_page_preview=True,
        )
        return SendResult.OK
    except Forbidden:
        # El usuario bloqueo el bot, o lo elimino. No tiene sentido reintentar.
        logger.warning("Chat %s bloqueo el bot (Forbidden) — se desvinculara", chat_id)
        return SendResult.PERMANENT_ERROR
    except BadRequest as e:
        msg = str(e).lower()
        if any(marker in msg for marker in _PERMANENT_BAD_REQUEST_MARKERS):
            logger.warning("Chat %s invalido (%s) — se desvinculara", chat_id, e)
            return SendResult.PERMANENT_ERROR
        logger.error("Telegram BadRequest transitorio chat=%s: %s", chat_id, e)
        return SendResult.TRANSIENT_ERROR
    except TelegramError as e:
        logger.error("Telegram send_message fallo chat=%s: %s", chat_id, e)
        return SendResult.TRANSIENT_ERROR


async def send_job(bot: Bot, chat_id: int, job: dict, job_id: str) -> SendResult:
    return await _send(bot, chat_id, format_job(job), build_keyboard(job_id, job.get("url", "")))


async def send_heartbeat(bot: Bot, chat_id: int) -> SendResult:
    return await _send(bot, chat_id, HEARTBEAT_TEXT)
