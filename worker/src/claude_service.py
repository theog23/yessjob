"""
Servicio de generacion de propuestas con Claude.
Portado del bot Workana original, ahora con estilo personalizable por
usuario y por plataforma (user_proposal_styles).
"""
import logging
import random

import anthropic

from src.config import ANTHROPIC_API_KEY, CLAUDE_MODEL

logger = logging.getLogger(__name__)

INVITACIONES = [
    "Podemos hablar por chat y aterrizar la solucion ideal para ti.",
    "Si te parece, podemos revisar detalles y proponerte el mejor enfoque.",
    "Si quieres, revisamos objetivos y siguientes pasos.",
]

_DEFAULT_ESTRUCTURA = """== IDIOMA ==
Espanol colombiano. Tutear SIEMPRE (tu, cuentame, puedes, tienes).
PROHIBIDO voseo argentino (vos, contame, podes, tenes).

== ESTRUCTURA ==
- Saludo corto: "Hola, como estas?"
- Mencion de portafolio en PDF.
- 2-3 lineas de apertura conectando con el dolor oculto y algo especifico del proyecto.
- Seccion "Caracteristicas principales de [bot/sitio/plataforma/app/automatizacion]:" con 3-8 bullets concretos sacados de la descripcion.
- Linea: "Trabajaria contigo de forma ordenada: analisis inicial, implementacion y ajustes finales."
- Linea de invitacion: "{invitacion}"
- Cierre: "Gracias por leer mi propuesta y quedo atento a cualquier duda. Saludos."
"""


def _build_prompt(job: dict, profile: str, invitacion: str, proposal_style: str | None) -> str:
    tags = ", ".join(job.get("skills", []) or []) or "No especificadas"
    desc = job.get("description") or ""

    if proposal_style and proposal_style.strip():
        estructura_section = f"""== ESTILO Y ESTRUCTURA (definido por el freelancer) ==
Segui esto al pie de la letra — es la forma en la que este freelancer
ya sabe que le funciona, tiene prioridad sobre cualquier otro criterio
de tono o estructura:

{proposal_style.strip()[:3000]}"""
    else:
        estructura_section = _DEFAULT_ESTRUCTURA.format(invitacion=invitacion)

    return f"""Escribe una propuesta profesional para un proyecto freelance.

== INSTRUCCION PRINCIPAL ==
ANTES de escribir, identifica el DOLOR PRINCIPAL OCULTO del cliente:
que le esta costando tiempo, dinero, clientes o esta danando su imagen.
Ese dolor debe aparecer en la apertura.

== PSICOLOGIA ==
En 10 segundos, el cliente debe sentir:
1. Entendiste su problema
2. Puedes resolverlo
3. Eres confiable
4. Sera facil trabajar contigo

== DATOS DEL PROYECTO ==
Titulo: {job.get("title","")}
Descripcion: {desc[:1400]}
Habilidades: {tags}
Plataforma: {job.get("platform","")}

== PERFIL DEL FREELANCER ==
{profile}

{estructura_section}

== REGLAS ==
- 100-180 palabras.
- NUNCA mencionar precios ni tarifas.
- NUNCA frases genericas ("me encantaria", "soy el candidato ideal", "amplia experiencia").
- Que suene humano, no template de IA.

Entrega SOLO el texto de la propuesta."""


def generate_proposal(job: dict, profile: str = "", proposal_style: str | None = None) -> str:
    if not ANTHROPIC_API_KEY:
        return "IA no configurada (falta ANTHROPIC_API_KEY)."

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    invitacion = random.choice(INVITACIONES)

    if not profile:
        profile = (
            "Desarrollador Full Stack con experiencia en React, Next.js, Python, IA, "
            "chatbots, automatizaciones (n8n, Make, Zapier), WordPress y scraping."
        )

    try:
        msg = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=900,
            messages=[{"role": "user", "content": _build_prompt(job, profile, invitacion, proposal_style)}],
        )
        return msg.content[0].text.strip()
    except Exception as e:
        logger.error("Claude fallo: %s", e)
        return f"Error generando propuesta: {e}"
