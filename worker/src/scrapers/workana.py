"""
Scraper Workana — portado de bot original.
El endpoint /jobs de Workana devuelve JSON cuando se le pide con
Accept: application/json + X-Requested-With: XMLHttpRequest.
"""
import hashlib
import logging
import random
import re
import time
from datetime import datetime, timezone
from typing import Iterable

import requests

from src.config import WORKANA_MAX_PAGES

logger = logging.getLogger(__name__)

URL_BASE = "https://www.workana.com/jobs"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Accept-Language": "es-ES,es;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
}


def _clean_html(text: str, limit: int = 2000) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()[:limit]


def _external_id(slug: str, title: str) -> str:
    base = slug or title
    return hashlib.md5(base.encode("utf-8")).hexdigest()[:16]


def _fetch_page(category: str, page: int) -> list[dict]:
    params = {
        "category": category,
        "language": "es",
        "order":    "recent",
        "page":     page,
    }
    headers = {
        **HEADERS,
        "Referer": f"https://www.workana.com/jobs?category={category}&language=es",
    }
    try:
        r = requests.get(URL_BASE, headers=headers, params=params, timeout=20)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logger.error("Workana %s p%d fallo: %s", category, page, e)
        return []

    results = (
        data.get("results", {}).get("results")
        or data.get("results")
        or data.get("jobs")
        or []
    )
    if isinstance(results, dict):
        results = results.get("results", [])
    return results


def _extract(item: dict) -> dict | None:
    title = _clean_html(item.get("title", ""), 200)
    if not title or len(title) < 5:
        return None

    slug = item.get("slug", "")
    url = f"https://www.workana.com/job/{slug}" if slug else item.get("url", "")
    description = _clean_html(item.get("description", ""))

    budget_str = "No especificado"
    budget_usd = None
    b = item.get("budget") or item.get("budgetValue") or item.get("price")
    if b:
        budget_str = str(b)
        m = re.search(r"(\d+(?:\.\d+)?)", str(b))
        if m:
            try:
                budget_usd = float(m.group(1))
            except ValueError:
                pass
    elif item.get("minBudget") and item.get("maxBudget"):
        budget_str = f"USD {item['minBudget']} - {item['maxBudget']}"
        try:
            budget_usd = float(item["minBudget"])
        except (TypeError, ValueError):
            pass

    skills: list[str] = []
    for s in (item.get("skills") or item.get("tags") or []):
        if isinstance(s, dict):
            name = s.get("title") or s.get("name") or s.get("anchorText", "")
            if name and len(name) < 40:
                skills.append(name)
        elif isinstance(s, str) and len(s) < 40:
            skills.append(s)

    posted_at = None
    for k in ("postedDate", "publishedAt", "createdAt"):
        v = item.get(k)
        if v:
            try:
                posted_at = datetime.fromisoformat(str(v).replace("Z", "+00:00")).isoformat()
                break
            except Exception:
                pass

    return {
        "platform":    "workana",
        "external_id": _external_id(slug, title),
        "title":       title,
        "description": description,
        "url":         url,
        "budget_str":  budget_str,
        "budget_usd":  budget_usd,
        "skills":      skills[:8],
        "language":    "es",
        "posted_at":   posted_at,
        "raw":         {"slug": slug},
        "scraped_at":  datetime.now(timezone.utc).isoformat(),
    }


def scrape(category: str, max_pages: int | None = None) -> list[dict]:
    """
    Devuelve una lista de jobs normalizados (sin filtrar).
    El filtrado por keywords/budget lo hace el orquestador.
    """
    max_pages = max_pages or WORKANA_MAX_PAGES
    out: list[dict] = []
    for page in range(1, max_pages + 1):
        items = _fetch_page(category, page)
        if not items:
            break
        for it in items:
            job = _extract(it)
            if job:
                out.append(job)
        time.sleep(random.uniform(1.5, 3.0))
    logger.info("Workana %s: %d jobs crudos", category, len(out))
    return out


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
