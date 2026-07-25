"""
Scraper Workana.

El endpoint /jobs de Workana devuelve JSON cuando se le pide con
Accept: application/json + X-Requested-With: XMLHttpRequest. No existe
API publica oficial (verificado) — este es el unico camino disponible.

Campos verificados contra una respuesta real (2026-07-25):
  - No hay ID numerico propio del proyecto, solo "slug" (que Workana usa
    en sus propias URLs publicas, por lo que es estable). Se usa el slug
    directo como external_id.
  - "skills" es una lista de objetos {anchorText, title, ...} donde
    "title" es una frase larga ("Trabajos Freelance de X") y "anchorText"
    es el nombre limpio de la skill ("X"). Hay que preferir anchorText.
  - "postedDate" es una fecha relativa en espanol ("Ayer", "Hace 4 horas"),
    no ISO 8601 — se parsea heuristicamente.
  - "totalBids" es un string tipo "Propuestas: 62", no un numero.
  - La respuesta trae "pagination.nextPage" con la pagina siguiente (o
    ausente/None si es la ultima) — es mas confiable que asumir que una
    pagina vacia significa "no hay mas resultados".
"""
import hashlib
import logging
import random
import re
import time
from datetime import datetime, timedelta, timezone

import requests

from src.config import WORKANA_MAX_PAGES

logger = logging.getLogger(__name__)

URL_BASE = "https://www.workana.com/jobs"
MAX_RETRIES = 3

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

_RELATIVE_ES_RE = re.compile(r"hace\s+(\d+)\s*(minuto|hora|d[ií]a)", re.IGNORECASE)
_BID_COUNT_RE = re.compile(r"(\d+)")


def _clean_html(text: str, limit: int = 2000) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()[:limit]


def _external_id(slug: str, title: str) -> str:
    if slug:
        return slug[:300]
    return "title-" + hashlib.md5(title.encode("utf-8")).hexdigest()[:16]


def _parse_relative_date(text: str) -> str | None:
    """Convierte fechas relativas en espanol ('Ayer', 'Hace 4 horas', 'Hoy')
    a un timestamp ISO aproximado. None si no se puede interpretar."""
    if not text:
        return None
    t = text.strip().lower()
    now = datetime.now(timezone.utc)
    if t in ("hoy", "ahora", "justo ahora"):
        return now.isoformat()
    if t == "ayer":
        return (now - timedelta(days=1)).isoformat()
    m = _RELATIVE_ES_RE.search(t)
    if not m:
        return None
    n = int(m.group(1))
    unit = m.group(2)
    if unit.startswith("minuto"):
        return (now - timedelta(minutes=n)).isoformat()
    if unit.startswith("hora"):
        return (now - timedelta(hours=n)).isoformat()
    return (now - timedelta(days=n)).isoformat()


def _parse_bid_count(text: str) -> int | None:
    if not text:
        return None
    m = _BID_COUNT_RE.search(text)
    return int(m.group(1)) if m else None


def _fetch_page(category: str, page: int) -> tuple[list[dict], bool, bool]:
    """Devuelve (items, hay_pagina_siguiente, tuvo_error_real).

    Reintenta con backoff ante fallos de red/HTTP antes de darse por
    vencido. "Sin resultados" (fin de paginacion normal) no cuenta como
    error.
    """
    params = {"category": category, "language": "es", "order": "recent", "page": page}
    headers = {**HEADERS, "Referer": f"https://www.workana.com/jobs?category={category}&language=es"}

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            r = requests.get(URL_BASE, headers=headers, params=params, timeout=20)
            r.raise_for_status()
            data = r.json()
            block = data.get("results")
            if isinstance(block, dict):
                items = block.get("results") or []
                pagination = block.get("pagination") or {}
            else:
                items = block or data.get("jobs") or []
                pagination = {}
            has_next = bool(pagination.get("nextPage"))
            return items, has_next, False
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)

    logger.error("Workana %s p%d fallo tras %d intentos: %s", category, page, MAX_RETRIES, last_error)
    return [], False, True


def _extract(item: dict) -> dict | None:
    title = _clean_html(item.get("title", ""), 200)
    if not title or len(title) < 5:
        return None

    slug = item.get("slug", "")
    url = f"https://www.workana.com/job/{slug}" if slug else item.get("url", "")
    description = _clean_html(item.get("description", ""))

    budget_str = "No especificado"
    budget_usd = None
    b = item.get("budget")
    if b:
        budget_str = str(b)
        m = re.search(r"(\d+(?:\.\d+)?)", str(b))
        if m:
            try:
                budget_usd = float(m.group(1))
            except ValueError:
                pass

    skills: list[str] = []
    for s in (item.get("skills") or []):
        if isinstance(s, dict):
            name = s.get("anchorText") or s.get("name") or s.get("title", "")
            if name and len(name) < 40:
                skills.append(name)
        elif isinstance(s, str) and len(s) < 40:
            skills.append(s)

    posted_at = _parse_relative_date(item.get("postedDate") or "")
    bid_count = _parse_bid_count(item.get("totalBids") or "")

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
        "raw":         {"slug": slug, "bid_count": bid_count},
        "scraped_at":  datetime.now(timezone.utc).isoformat(),
    }


def scrape(category: str, max_pages: int | None = None) -> tuple[list[dict], bool]:
    """
    Devuelve (jobs, tuvo_error). jobs son los proyectos normalizados y sin
    filtrar (el filtrado por usuario lo hace el orquestador). tuvo_error
    indica si alguna pagina fallo tras agotar reintentos — util para que
    el scheduler trackee fallos consecutivos entre ciclos.
    """
    max_pages = max_pages or WORKANA_MAX_PAGES
    out: list[dict] = []
    had_error = False

    for page in range(1, max_pages + 1):
        items, has_next, error = _fetch_page(category, page)
        if error:
            had_error = True
            break

        for it in items:
            job = _extract(it)
            if job:
                out.append(job)

        if not has_next:
            break
        time.sleep(random.uniform(1.5, 3.0))

    logger.info(
        "Workana %s: %d jobs crudos%s", category, len(out), " (con errores)" if had_error else ""
    )
    return out, had_error
