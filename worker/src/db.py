"""
Cliente Supabase (service role) para el worker.
Bypassa RLS y accede a todas las tablas.
"""
from datetime import datetime, timedelta, timezone
from typing import Any
from supabase import create_client, Client
from src.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

_client: Client | None = None


def sb() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _client


# --------------------------------------------------------
#  Usuarios y filtros
# --------------------------------------------------------
def get_active_user_platforms() -> list[dict]:
    """
    Devuelve una fila por (usuario x plataforma x sector) para usuarios
    con suscripcion activa y telegram vinculado.

    Cada fila trae:
      user_id, chat_id, plan_slug, platform, sector, keywords,
      excluded_keywords, min_budget_usd.
    """
    data = sb().rpc("get_active_scrape_targets").execute().data
    return data or []


def get_sector_by_id(sector_id: str) -> dict | None:
    r = sb().table("sectors").select("*").eq("id", sector_id).limit(1).execute()
    return r.data[0] if r.data else None


# --------------------------------------------------------
#  Jobs
# --------------------------------------------------------
def upsert_job(job: dict) -> str | None:
    """
    Inserta el job (si es nuevo por (platform, external_id)) y devuelve su id.
    Si ya existe, devuelve el id existente.
    """
    payload = {
        "platform":    job["platform"],
        "external_id": job["external_id"],
        "title":       job["title"],
        "description": job.get("description"),
        "url":         job["url"],
        "budget_str":  job.get("budget_str"),
        "budget_usd":  job.get("budget_usd"),
        "skills":      job.get("skills") or [],
        "language":    job.get("language"),
        "posted_at":   job.get("posted_at"),
        "raw":         job.get("raw"),
    }
    r = (
        sb().table("scraped_jobs")
        .upsert(payload, on_conflict="platform,external_id")
        .execute()
    )
    if r.data:
        return r.data[0]["id"]
    q = (
        sb().table("scraped_jobs")
        .select("id")
        .eq("platform", job["platform"])
        .eq("external_id", job["external_id"])
        .limit(1)
        .execute()
    )
    return q.data[0]["id"] if q.data else None


def was_notified(user_id: str, job_id: str) -> bool:
    r = (
        sb().table("notifications_sent")
        .select("id")
        .eq("user_id", user_id)
        .eq("job_id", job_id)
        .limit(1)
        .execute()
    )
    return bool(r.data)


def mark_notified(user_id: str, job_id: str) -> None:
    sb().table("notifications_sent").insert(
        {"user_id": user_id, "job_id": job_id}
    ).execute()


# --------------------------------------------------------
#  Telegram link (bot handlers)
# --------------------------------------------------------
def consume_link_token(token: str) -> str | None:
    r = (
        sb().table("telegram_link_tokens")
        .select("user_id, expires_at, used_at")
        .eq("token", token)
        .limit(1)
        .execute()
    )
    if not r.data:
        return None
    row = r.data[0]
    if row.get("used_at"):
        return None
    if datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00")) < datetime.now(timezone.utc):
        return None
    sb().table("telegram_link_tokens").update(
        {"used_at": datetime.now(timezone.utc).isoformat()}
    ).eq("token", token).execute()
    return row["user_id"]


def upsert_telegram_link(user_id: str, chat_id: int, username: str | None) -> None:
    sb().table("telegram_links").upsert(
        {"user_id": user_id, "chat_id": chat_id, "username": username},
        on_conflict="user_id",
    ).execute()


def get_user_by_chat_id(chat_id: int) -> str | None:
    r = (
        sb().table("telegram_links")
        .select("user_id")
        .eq("chat_id", chat_id)
        .limit(1)
        .execute()
    )
    return r.data[0]["user_id"] if r.data else None


def unlink_telegram(user_id: str) -> None:
    sb().table("telegram_links").delete().eq("user_id", user_id).execute()


def unlink_telegram_by_chat(chat_id: int) -> None:
    sb().table("telegram_links").delete().eq("chat_id", chat_id).execute()


def get_last_activity(user_id: str) -> datetime | None:
    r = (
        sb().table("telegram_links")
        .select("last_activity_at")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not r.data:
        return None
    raw = r.data[0]["last_activity_at"]
    return datetime.fromisoformat(raw.replace("Z", "+00:00"))


def touch_activity(user_id: str) -> None:
    sb().table("telegram_links").update(
        {"last_activity_at": datetime.now(timezone.utc).isoformat()}
    ).eq("user_id", user_id).execute()


# --------------------------------------------------------
#  Cuotas
# --------------------------------------------------------
def proposals_today(user_id: str) -> int:
    since = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    r = (
        sb().table("usage_log")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("action", "proposal_generated")
        .gte("created_at", since)
        .execute()
    )
    return r.count or 0


def log_usage(user_id: str, action: str, metadata: dict[str, Any] | None = None) -> None:
    sb().table("usage_log").insert(
        {"user_id": user_id, "action": action, "metadata": metadata or {}}
    ).execute()


def get_cached_job(job_id: str) -> dict | None:
    r = sb().table("scraped_jobs").select("*").eq("id", job_id).limit(1).execute()
    return r.data[0] if r.data else None


def get_user_plan(user_id: str) -> dict | None:
    r = (
        sb().from_("v_active_users")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return r.data[0] if r.data else None
