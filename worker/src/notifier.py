"""
Formatea y envia notificaciones de jobs a cada usuario en Telegram.
"""
import logging
from typing import Any

from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.error import TelegramError

logger = logging.getLogger(__name__)


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


async def send_job(bot: Bot, chat_id: int, job: dict, job_id: str) -> bool:
    try:
        await bot.send_message(
            chat_id=chat_id,
            text=format_job(job),
            reply_markup=build_keyboard(job_id, job.get("url", "")),
            disable_web_page_preview=True,
        )
        return True
    except TelegramError as e:
        logger.error("Telegram send_message fallo chat=%s: %s", chat_id, e)
        return False


async def send_text(bot: Bot, chat_id: int, text: str, **kwargs: Any) -> bool:
    try:
        await bot.send_message(chat_id=chat_id, text=text, **kwargs)
        return True
    except TelegramError as e:
        logger.error("Telegram send_text fallo chat=%s: %s", chat_id, e)
        return False
