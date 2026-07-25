"""
Scraper Freelancer.com — portado del proyecto original.
Usa curl_cffi con impersonate=chrome porque Freelancer bloquea
requests/httpx desde IPs de datacenter por TLS fingerprinting.
"""
import logging
from datetime import datetime, timezone
from typing import Iterable

from src.config import FREELANCER_COOKIES, FREELANCER_RESULTS

logger = logging.getLogger(__name__)

BASE_URL = "https://www.freelancer.com/api/projects/0.1/projects/active"


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


def scrape(skill_ids: list[int], limit: int | None = None) -> list[dict]:
    from curl_cffi import requests as curl_requests

    limit = limit or FREELANCER_RESULTS
    if not skill_ids:
        return []

    params: list[tuple] = [
        ("limit", limit),
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
            logger.error("Freelancer HTTP %d: %s", r.status_code, r.text[:200])
            return []
        data = r.json()
        if data.get("status") != "success":
            logger.error("Freelancer API status=%s", data.get("status"))
            return []
        raw = data.get("result", {}).get("projects", []) or []
    except Exception as e:
        logger.error("Freelancer fetch fallo: %s", e)
        return []

    normalized = [_normalize(p) for p in raw]
    normalized = [j for j in normalized if j]
    logger.info("Freelancer skills=%s: %d jobs crudos", skill_ids[:3], len(normalized))
    return normalized


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


def matches_filter(
    job: dict,
    keywords: Iterable[str],
    excluded: Iterable[str],
    min_budget: float,
) -> bool:
    text = f"{job.get('title','')} {job.get('description','')} {' '.join(job.get('skills',[]))}".lower()
    for k in excluded:
        if k and k.lower() in text:
            return False
    if min_budget and (job.get("budget_usd") or 0) > 0 and job["budget_usd"] < min_budget:
        return False
    kws = [k for k in keywords if k]
    if not kws:
        return True
    return any(k.lower() in text for k in kws)
