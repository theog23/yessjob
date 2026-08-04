import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL              = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

TELEGRAM_BOT_TOKEN        = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_BOT_USERNAME     = os.getenv("TELEGRAM_BOT_USERNAME", "").lstrip("@")

ANTHROPIC_API_KEY         = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL              = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

FREELANCER_COOKIES        = os.getenv("FREELANCER_COOKIES", "").strip()

SCRAPE_LOOP_MIN_SECONDS   = int(os.getenv("SCRAPE_LOOP_MIN_SECONDS", "30"))
SCRAPE_LOOP_MAX_SECONDS   = int(os.getenv("SCRAPE_LOOP_MAX_SECONDS", "90"))
WORKANA_MAX_PAGES         = int(os.getenv("WORKANA_MAX_PAGES", "2"))
FREELANCER_RESULTS        = int(os.getenv("FREELANCER_RESULTS_PER_RUN", "20"))

APP_URL                   = os.getenv("APP_URL", "").rstrip("/")
WARP_PROXY_URL            = os.getenv("WARP_PROXY_URL", "").strip()


def validate() -> list[str]:
    missing = []
    if not SUPABASE_URL:              missing.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_ROLE_KEY: missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if not TELEGRAM_BOT_TOKEN:        missing.append("TELEGRAM_BOT_TOKEN")
    if not TELEGRAM_BOT_USERNAME:     missing.append("TELEGRAM_BOT_USERNAME")
    if not ANTHROPIC_API_KEY:         missing.append("ANTHROPIC_API_KEY")
    return missing
