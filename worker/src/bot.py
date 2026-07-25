"""
Bot de Telegram unico.

Vinculacion:
  El usuario entra al frontend, pide "vincular Telegram" -> la web
  crea una fila en telegram_link_tokens con un token corto y muestra
  un boton "Abrir bot" apuntando a:

    https://t.me/<TELEGRAM_BOT_USERNAME>?start=<token>

  Cuando el usuario pulsa el boton, Telegram abre el bot y ejecuta
  "/start <token>". El handler cambia el token a "usado" y guarda
  el chat_id contra el user_id.
"""
import logging

from telegram import Update
from telegram.ext import (
    Application,
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
)

from src import db
from src.claude_service import generate_proposal
from src.config import TELEGRAM_BOT_TOKEN

logger = logging.getLogger(__name__)


async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    chat = update.effective_chat
    user = update.effective_user

    args = ctx.args or []
    token = args[0].strip() if args else None

    if not token:
        already = db.get_user_by_chat_id(chat.id)
        if already:
            await update.message.reply_text(
                "Tu cuenta ya esta vinculada. Recibiras aqui los proyectos que coincidan con tus filtros."
            )
        else:
            await update.message.reply_text(
                "Hola. Para vincular este chat con tu cuenta abre la app y pulsa \"Vincular Telegram\"."
            )
        return

    user_id = db.consume_link_token(token)
    if not user_id:
        await update.message.reply_text(
            "El token de vinculacion es invalido o expiro. Genera uno nuevo en la app."
        )
        return

    db.upsert_telegram_link(user_id, chat.id, user.username)
    await update.message.reply_text(
        "Cuenta vinculada correctamente.\n\n"
        "A partir de ahora recibiras los proyectos de Workana/Freelancer "
        "que coincidan con tus filtros."
    )


async def cmd_status(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = db.get_user_by_chat_id(update.effective_chat.id)
    if not user_id:
        await update.message.reply_text("Este chat no esta vinculado a ninguna cuenta.")
        return
    plan = db.get_user_plan(user_id)
    if not plan:
        await update.message.reply_text("Tu suscripcion no esta activa.")
        return
    await update.message.reply_text(
        f"Cuenta activa\n"
        f"Plan: {plan['plan_slug']}\n"
        f"Propuestas hoy: {db.proposals_today(user_id)}/{plan['max_proposals_per_day']}\n"
        f"Intervalo minimo: {plan['min_scrape_interval_min']} min"
    )


async def cmd_unlink(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    db.unlink_telegram_by_chat(update.effective_chat.id)
    await update.message.reply_text("Chat desvinculado. Puedes volver a vincularlo desde la app.")


async def cb_propose(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer("Generando propuesta...")

    chat_id = query.message.chat.id
    user_id = db.get_user_by_chat_id(chat_id)
    if not user_id:
        await query.message.reply_text("No tengo tu cuenta vinculada.")
        return

    plan = db.get_user_plan(user_id)
    if not plan:
        await query.message.reply_text("Tu suscripcion no esta activa.")
        return

    used = db.proposals_today(user_id)
    limit = plan["max_proposals_per_day"]
    if used >= limit:
        await query.message.reply_text(
            f"Alcanzaste el limite de propuestas de tu plan ({limit}/dia).\n"
            f"Reintenta manana o mejora tu plan."
        )
        return

    try:
        job_id = query.data.split(":", 1)[1]
    except IndexError:
        await query.message.reply_text("Callback invalido.")
        return

    job = db.get_cached_job(job_id)
    if not job:
        await query.message.reply_text("No encontre datos del proyecto (puede ser muy antiguo).")
        return

    thinking = await query.message.reply_text("Claude esta redactando la propuesta...")

    import asyncio
    loop = asyncio.get_event_loop()
    text = await loop.run_in_executor(None, generate_proposal, job)

    try:
        await thinking.delete()
    except Exception:
        pass

    db.log_usage(user_id, "proposal_generated", {"job_id": job_id})

    for chunk in _split_chunks(text, 4000):
        await query.message.reply_text(chunk)


def _split_chunks(text: str, size: int) -> list[str]:
    return [text[i:i + size] for i in range(0, len(text), size)] or [""]


def build_application() -> Application:
    app = (
        ApplicationBuilder()
        .token(TELEGRAM_BOT_TOKEN)
        .build()
    )
    app.add_handler(CommandHandler("start",  cmd_start))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("unlink", cmd_unlink))
    app.add_handler(CallbackQueryHandler(cb_propose, pattern=r"^propose:"))
    return app
