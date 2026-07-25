"""
Traduccion gratuita al espanol (para tarjetas de Freelancer en ingles).
"""
import logging

logger = logging.getLogger(__name__)


def _detect(text: str) -> str:
    try:
        from langdetect import detect
        return detect(text[:200]).split("-")[0].lower()
    except Exception:
        spanish = ["necesito", "quiero", "busco", "proyecto", "desarrollo",
                   "aplicacion", "sistema", "pagina", "sitio", "trabajo"]
        low = text[:200].lower()
        if sum(1 for w in spanish if f" {w} " in f" {low} ") >= 2:
            return "es"
        return "en"


def translate_to_es(text: str) -> str:
    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source="auto", target="es").translate(text[:4500]) or text
    except Exception as e:
        logger.warning("Traduccion fallo: %s", e)
        return text


def translate_job(job: dict) -> dict:
    """Anota job con title_es / description_es si detecta ingles/otro."""
    full = f"{job.get('title','')} {job.get('description','')}"
    lang = _detect(full)
    job["detected_language"] = lang
    if lang != "es":
        job["title_es"] = translate_to_es(job.get("title", ""))
        job["description_es"] = translate_to_es(job.get("description", ""))
        job["needs_translation"] = True
    else:
        job["needs_translation"] = False
    return job
