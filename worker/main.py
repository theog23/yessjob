"""
Punto de entrada del worker.
Corre en paralelo:
  1. Bot de Telegram (polling)
  2. Loop de scraping multi-usuario
"""
import asyncio
import logging
import signal
import sys

from src.bot import build_application
from src.config import SCRAPE_LOOP_MIN_SECONDS, SCRAPE_LOOP_MAX_SECONDS, validate
from src.scheduler import loop_forever

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("telegram").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)


async def main() -> None:
    missing = validate()
    if missing:
        for m in missing:
            logger.error("Falta variable: %s", m)
        sys.exit(1)

    app = build_application()
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)
    logger.info("Bot de Telegram corriendo")

    scrape_task = asyncio.create_task(
        loop_forever(app.bot, SCRAPE_LOOP_MIN_SECONDS, SCRAPE_LOOP_MAX_SECONDS)
    )
    stop = asyncio.Event()

    def _shutdown(*_):
        logger.info("Shutdown solicitado")
        stop.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _shutdown)
        except NotImplementedError:
            signal.signal(sig, lambda *_: _shutdown())

    await stop.wait()

    scrape_task.cancel()
    try:
        await scrape_task
    except asyncio.CancelledError:
        pass

    await app.updater.stop()
    await app.stop()
    await app.shutdown()
    logger.info("Worker detenido")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
