"""
Logica de matching compartida entre scrapers (antes duplicada
identicamente en workana.py y freelancer.py).
"""
from typing import Iterable


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
