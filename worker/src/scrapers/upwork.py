"""
Scraper Upwork.

NO usa login ni cuenta: simula lo que ve cualquier visitante anonimo
que entra a upwork.com sin loguearse. Upwork expone una cookie
"visitor_gql_token" en la homepage para visitantes anonimos, que sirve
como Bearer token contra su endpoint GraphQL interno
(/api/graphql/v1) para buscar proyectos publicos — el mismo mecanismo
que usa su propia pagina de busqueda.

Validado en una PoC aislada (2026-07-26) con curl_cffi + impersonate
Chrome, SIN proxy: 22/22 llamadas GraphQL exitosas y 7/8 obtenciones
de token exitosas (la unica falla fue un timeout de red transitorio,
no un bloqueo). No se detecto ningun desafio de Cloudflare con esta
tecnica (a diferencia de pegarle directo a la pagina de busqueda
/nx/jobs/search/, que si esta protegida).

Diferencia clave con Workana/Freelancer: la busqueda publica de Upwork
no acepta filtro de categoria/skill en el request, asi que no hay forma
de acotar el scraping por sector a nivel de la consulta de origen. Se
trae el feed general ordenado por "recency" y el filtrado real lo hacen
las keywords del usuario (matches_filter), igual que con las otras
plataformas.

IMPORTANTE: no se corrio scraping local sostenido a proposito, para no
generar un patron de trafico repetido desde una IP residencial. La
validacion de estabilidad en uso continuo se hace una vez desplegado
en Railway, no en desarrollo local.
"""
import logging
import time
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

HOMEPAGE_URL = "https://www.upwork.com/"
GRAPHQL_URL = "https://www.upwork.com/api/graphql/v1"
MAX_RETRIES = 3
MAX_PAGES_PER_CYCLE = 3
PAGE_SIZE = 25
TOKEN_TTL_SECONDS = 20 * 60  # el token dura ~25 min segun la comunidad; refrescamos antes por margen

GRAPHQL_QUERY = """
query VisitorJobSearch($requestVariables: VisitorJobSearchV1Request!) {
  search {
    universalSearchNuxt {
      visitorJobSearchV1(request: $requestVariables) {
        paging {
          total
          offset
          count
        }
        results {
          id
          title
          description
          ontologySkills {
            prefLabel
          }
          jobTile {
            job {
              id
              ciphertext: cipherText
              jobType
              hourlyBudgetMax
              hourlyBudgetMin
              contractorTier
              publishTime
              hourlyEngagementDuration {
                weeks
              }
              fixedPriceAmount {
                amount
              }
              fixedPriceEngagementDuration {
                weeks
              }
            }
          }
        }
      }
    }
  }
}
""".strip()

_token_cache: dict[str, object] = {"token": None, "fetched_at": 0.0}


def _fetch_visitor_token() -> tuple[str | None, bool]:
    """Pega a la homepage como visitante anonimo (GET simple, sin login)
    y saca la cookie visitor_gql_token. Devuelve (token, tuvo_error).

    Un solo intento, sin reintento en rafaga: Upwork rate-limitea (429)
    ante 2-3 requests seguidos en pocos segundos desde la misma IP, asi
    que reintentar rapido ante un fallo empeora las cosas. El scheduler
    ya solo llama a esto una vez por ciclo (cada 5-60min segun el plan),
    asi que el proximo ciclo actua como reintento natural, bien espaciado.
    """
    from curl_cffi import requests as curl_requests

    try:
        r = curl_requests.get(HOMEPAGE_URL, impersonate="chrome146", timeout=30)
        r.raise_for_status()
        token = r.cookies.get("visitor_gql_token")
        if token:
            return token, False
        error: Exception = RuntimeError("respuesta sin cookie visitor_gql_token")
    except Exception as e:
        error = e

    logger.error("Upwork: fallo obteniendo token de visitante: %s", error)
    return None, True


def _get_token() -> tuple[str | None, bool]:
    """Reusa el token cacheado si todavia esta fresco; si no, pide uno
    nuevo. Si el refresh falla pero habia uno viejo, lo devuelve igual
    (mejor intentar con uno posiblemente vencido que no intentar)."""
    now = time.time()
    cached = _token_cache["token"]
    age = now - float(_token_cache["fetched_at"] or 0)

    if cached and age < TOKEN_TTL_SECONDS:
        return cached, False  # type: ignore[return-value]

    token, had_error = _fetch_visitor_token()
    if token:
        _token_cache["token"] = token
        _token_cache["fetched_at"] = now
        return token, False

    if cached:
        return cached, had_error  # type: ignore[return-value]
    return None, True


def _invalidate_token() -> None:
    _token_cache["token"] = None
    _token_cache["fetched_at"] = 0.0


def _fetch_jobs_page(token: str, offset: int, count: int) -> tuple[list[dict], bool, bool]:
    """Devuelve (resultados_crudos, token_invalido, tuvo_error_real)."""
    from curl_cffi import requests as curl_requests

    headers = {
        "Accept": "*/*",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.7",
        "Referer": "https://www.upwork.com/nx/search/jobs/?",
        "X-Upwork-Accept-Language": "en-US",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }
    payload = {
        "query": GRAPHQL_QUERY,
        "variables": {
            "requestVariables": {
                "sort": "recency",
                "highlight": True,
                "paging": {"offset": offset, "count": count},
            }
        },
    }

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            r = curl_requests.post(
                GRAPHQL_URL, headers=headers, json=payload, impersonate="chrome146", timeout=30
            )
            if r.status_code == 401:
                return [], True, False
            if r.status_code == 429:
                # Rate limit: reintentar rapido lo empeora, cortamos ya
                # mismo y dejamos que el proximo ciclo lo reintente.
                logger.error("Upwork GraphQL: rate limited (429) en offset=%d", offset)
                return [], False, True
            r.raise_for_status()
            data = r.json()
            if "errors" in data:
                raise RuntimeError(str(data["errors"])[:300])
            results = (
                data.get("data", {})
                .get("search", {})
                .get("universalSearchNuxt", {})
                .get("visitorJobSearchV1", {})
                .get("results", [])
            )
            return results, False, False
        except Exception as e:
            last_error = e
        if attempt < MAX_RETRIES - 1:
            time.sleep(2 ** attempt)

    logger.error("Upwork GraphQL fallo (offset=%d) tras %d intentos: %s", offset, MAX_RETRIES, last_error)
    return [], False, True


def _normalize(item: dict) -> dict | None:
    tile = (item.get("jobTile") or {}).get("job") or {}
    job_id = str(tile.get("id") or item.get("id") or "")
    title = (item.get("title") or "").strip()
    if not job_id or not title:
        return None

    description = (item.get("description") or "").strip()[:2000]
    cipher = tile.get("ciphertext") or ""
    url = f"https://www.upwork.com/jobs/~{cipher}" if cipher else ""

    job_type = str(tile.get("jobType") or "").upper()
    budget_str = "No especificado"
    budget_usd: float | None = None

    lo, hi = tile.get("hourlyBudgetMin"), tile.get("hourlyBudgetMax")
    if job_type == "HOURLY" or lo or hi:
        try:
            if lo and hi:
                budget_str = f"USD {float(lo):.0f} - {float(hi):.0f} /hora"
                budget_usd = float(lo)
            elif lo:
                budget_str = f"USD {float(lo):.0f}+/hora"
                budget_usd = float(lo)
        except (TypeError, ValueError):
            pass
    else:
        amount = (tile.get("fixedPriceAmount") or {}).get("amount")
        if amount:
            try:
                budget_usd = float(amount)
                budget_str = f"USD {budget_usd:.0f}"
            except (TypeError, ValueError):
                pass

    skills = [
        s.get("prefLabel", "")
        for s in (item.get("ontologySkills") or [])
        if isinstance(s, dict) and s.get("prefLabel")
    ][:8]

    posted_at = None
    publish_time = tile.get("publishTime")
    if publish_time:
        try:
            posted_at = datetime.fromisoformat(str(publish_time).replace("Z", "+00:00")).isoformat()
        except Exception:
            try:
                posted_at = datetime.fromtimestamp(float(publish_time), tz=timezone.utc).isoformat()
            except Exception:
                posted_at = None

    return {
        "platform":    "upwork",
        "external_id": job_id,
        "title":       title[:300],
        "description": description,
        "url":         url,
        "budget_str":  budget_str,
        "budget_usd":  budget_usd,
        "skills":      skills,
        "language":    "en",
        "posted_at":   posted_at,
        "raw":         {"contractor_tier": tile.get("contractorTier"), "job_type": job_type},
        "scraped_at":  datetime.now(timezone.utc).isoformat(),
    }


def scrape(limit: int | None = None) -> tuple[list[dict], bool]:
    """
    Devuelve (jobs, tuvo_error). No recibe categoria/skills porque la
    busqueda publica de Upwork no los soporta como filtro de origen —
    siempre trae el feed general "mas reciente", y el filtrado por
    usuario (keywords/excluded/min_budget) pasa por matches_filter
    igual que con Workana y Freelancer.
    """
    page_size = limit or PAGE_SIZE
    token, had_error = _get_token()
    if not token:
        return [], True

    out: list[dict] = []
    offset = 0

    for _ in range(MAX_PAGES_PER_CYCLE):
        raw, token_invalid, error = _fetch_jobs_page(token, offset, page_size)

        if token_invalid:
            # El token cacheado vencio antes de lo esperado: forzamos
            # un refresh y reintentamos esta misma pagina una vez.
            _invalidate_token()
            token, refresh_error = _get_token()
            if not token:
                had_error = True
                break
            raw, token_invalid, error = _fetch_jobs_page(token, offset, page_size)

        if error:
            had_error = True
            break
        if not raw:
            break

        for item in raw:
            job = _normalize(item)
            if job:
                out.append(job)

        if len(raw) < page_size:
            break
        offset += page_size

    logger.info("Upwork: %d jobs crudos%s", len(out), " (con errores)" if had_error else "")
    return out, had_error
