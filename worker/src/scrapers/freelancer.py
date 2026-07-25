"""
Scraper Freelancer.com.

Usa curl_cffi con impersonate=chrome porque Freelancer bloquea
requests/httpx desde IPs de datacenter por TLS fingerprinting. No hay
API publica oficial accesible (requiere aprobacion manual de OAuth app,
no otorgada), asi que se usa el endpoint interno que el propio sitio usa
para listar proyectos activos.

Campos verificados contra una respuesta real (2026-07-25): budget.minimum/
maximum, currency.exchange_rate, bid_stats.bid_count, jobs[].name,
submitdate y seo_url coinciden exactamente con lo que ya normalizaba este
modulo — no habia bugs de parseo aca. Lo que si se confirmo es que el
endpoint soporta paginacion real via el parametro "offset" (probado:
offset=0 y offset=3 devuelven proyectos distintos sin solaparse).
"""
import logging
import time
from datetime import datetime, timezone

from src.config import FREELANCER_COOKIES, FREELANCER_RESULTS

logger = logging.getLogger(__name__)

BASE_URL = "https://www.freelancer.com/api/projects/0.1/projects/active"
MAX_RETRIES = 3
MAX_PAGES_PER_CYCLE = 3  # tope defensivo para no crecer sin limite en un ciclo


def _cookies() -> dict:
    if not FREELANCER_COOKIES:
        return {}
    out: dict[str, str] = {}
    for part in FREELANCER_COOKIES.split(";"):
        part = part.strip()
        if "=" in part:
            k, _, v = part.partition("=")
            out[k.strip()] = v.strip()
    return out


def _fetch_page(skill_ids: list[int], limit: int, offset: int) -> tuple[list[dict], bool]:
    """Devuelve (proyectos_crudos, tuvo_error_real). Reintenta con backoff
    ante fallos de red/HTTP/estado antes de darse por vencido."""
    from curl_cffi import requests as curl_requests

    params: list[tuple] = [
        ("limit", limit),
        ("offset", offset),
        ("full_description", "true"),
        ("job_details", "true"),
        ("sort_field", "submitdate"),
        ("compact", "true"),
        ("new_errors", "true"),
        ("new_pools", "true"),
        ("project_types[]", "fixed"),
        ("project_types[]", "hourly"),
        ("languages[]", "en"),
        ("languages[]", "es"),
    ]
    for sid in skill_ids:
        params.append(("jobs[]", sid))

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "es-US,es;q=0.9",
        "Freelancer-App-Name": "main",
        "Freelancer-App-Platform": "web",
        "Origin": "https://www.freelancer.com",
        "Referer": "https://www.freelancer.com/",
    }

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            r = curl_requests.get(
                BASE_URL,
                params=params,
                headers=headers,
                cookies=_cookies(),
                impersonate="chrome",
                timeout=30,
            )
            if r.status_code != 200:
                raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
            data = r.json()
            if data.get("status") != "success":
                raise RuntimeError(f"status={data.get('status')}")
            return data.get("result", {}).get("projects", []) or [], False
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)

    logger.error(
        "Freelancer fetch fallo (offset=%d) tras %d intentos: %s", offset, MAX_RETRIES, last_error
    )
    return [], True


def scrape(skill_ids: list[int], limit: int | None = None) -> tuple[list[dict], bool]:
    """
    Devuelve (jobs, tuvo_error). Pagina via offset mientras la pagina
    anterior venga llena (senal de que puede haber mas), hasta
    MAX_PAGES_PER_CYCLE paginas por ciclo.
    """
    limit = limit or FREELANCER_RESULTS
    if not skill_ids:
        return [], False

    out: list[dict] = []
    had_error = False
    offset = 0

    for _ in range(MAX_PAGES_PER_CYCLE):
        raw, error = _fetch_page(skill_ids, limit, offset)
        if error:
            had_error = True
            break
        if not raw:
            break

        for p in raw:
            job = _normalize(p)
            if job:
                out.append(job)

        if len(raw) < limit:
            break  # ultima pagina disponible (vino incompleta)
        offset += limit

    logger.info(
        "Freelancer skills=%s: %d jobs crudos%s",
        skill_ids[:3], len(out), " (con errores)" if had_error else "",
    )
    return out, had_error


def _normalize(raw: dict) -> dict | None:
    pid = str(raw.get("id", ""))
    title = (raw.get("title") or "").strip()
    if not pid or not title:
        return None

    description = (raw.get("description") or "").strip()[:2000]
    seo = raw.get("seo_url", "")
    url = f"https://www.freelancer.com/projects/{seo}" if seo else ""

    budget = raw.get("budget", {}) or {}
    currency = raw.get("currency", {}) or {}
    fx = currency.get("exchange_rate", 1.0) or 1.0
    minb, maxb = budget.get("minimum"), budget.get("maximum")
    budget_str, budget_usd = "No especificado", None
    if minb and maxb:
        budget_usd = round(minb * fx, 2)
        budget_str = f"USD {round(minb*fx):.0f} - {round(maxb*fx):.0f}"
    elif minb:
        budget_usd = round(minb * fx, 2)
        budget_str = f"USD {round(minb*fx):.0f}+"

    skills = [j.get("name", "") for j in (raw.get("jobs") or []) if j.get("name")][:8]
    submit_time = raw.get("submitdate") or raw.get("time_submitted") or 0
    posted_at = (
        datetime.fromtimestamp(submit_time, tz=timezone.utc).isoformat()
        if submit_time else None
    )

    return {
        "platform":    "freelancer",
        "external_id": pid,
        "title":       title[:300],
        "description": description,
        "url":         url,
        "budget_str":  budget_str,
        "budget_usd":  budget_usd,
        "skills":      skills,
        "language":    raw.get("language", "en"),
        "posted_at":   posted_at,
        "raw":         {"type": raw.get("type"), "bid_count": (raw.get("bid_stats") or {}).get("bid_count", 0)},
        "scraped_at":  datetime.now(timezone.utc).isoformat(),
    }
