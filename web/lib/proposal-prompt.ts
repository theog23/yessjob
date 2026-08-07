import "server-only";

// Puerto manual de worker/src/claude_service.py::_build_prompt. No hay
// forma de compartir codigo entre el worker Python (sin servidor HTTP)
// y esta app Next.js -- mantener sincronizados a mano si el prompt
// cambia.

export const DEFAULT_PROFILE =
  "Desarrollador Full Stack con experiencia en React, Next.js, Python, IA, " +
  "chatbots, automatizaciones (n8n, Make, Zapier), WordPress y scraping.";

const INVITACIONES = [
  "Podemos hablar por chat y aterrizar la solucion ideal para ti.",
  "Si te parece, podemos revisar detalles y proponerte el mejor enfoque.",
  "Si quieres, revisamos objetivos y siguientes pasos.",
];

function defaultEstructura(invitacion: string): string {
  return `== IDIOMA ==
Espanol colombiano. Tutear SIEMPRE (tu, cuentame, puedes, tienes).
PROHIBIDO voseo argentino (vos, contame, podes, tenes).

== ESTRUCTURA ==
- Saludo corto: "Hola, como estas?"
- Mencion de portafolio en PDF.
- 2-3 lineas de apertura conectando con el dolor oculto y algo especifico del proyecto.
- Seccion "Caracteristicas principales de [bot/sitio/plataforma/app/automatizacion]:" con 3-8 bullets concretos sacados de la descripcion.
- Linea: "Trabajaria contigo de forma ordenada: analisis inicial, implementacion y ajustes finales."
- Linea de invitacion: "${invitacion}"
- Cierre: "Gracias por leer mi propuesta y quedo atento a cualquier duda. Saludos."`;
}

type JobForPrompt = {
  title: string;
  description: string | null;
  skills: string[] | null;
  platform: string;
};

export function buildProposalPrompt(
  job: JobForPrompt,
  profile: string,
  proposalStyle: string | null,
): string {
  const tags = (job.skills ?? []).join(", ") || "No especificadas";
  const desc = (job.description ?? "").slice(0, 1400);
  const invitacion = INVITACIONES[Math.floor(Math.random() * INVITACIONES.length)];

  const estructuraSection =
    proposalStyle && proposalStyle.trim()
      ? `== ESTILO Y ESTRUCTURA (definido por el freelancer) ==
Segui esto al pie de la letra, es la forma en la que este freelancer
ya sabe que le funciona, tiene prioridad sobre cualquier otro criterio
de tono o estructura:

${proposalStyle.trim().slice(0, 3000)}`
      : defaultEstructura(invitacion);

  return `Escribe una propuesta profesional para un proyecto freelance.

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
Titulo: ${job.title ?? ""}
Descripcion: ${desc}
Habilidades: ${tags}
Plataforma: ${job.platform ?? ""}

== PERFIL DEL FREELANCER ==
${profile}

${estructuraSection}

== REGLAS ==
- 100-180 palabras.
- NUNCA mencionar precios ni tarifas.
- NUNCA frases genericas ("me encantaria", "soy el candidato ideal", "amplia experiencia").
- Que suene humano, no template de IA.

Entrega SOLO el texto de la propuesta.`;
}
