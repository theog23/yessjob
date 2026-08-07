"use server";

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildProposalPrompt, DEFAULT_PROFILE } from "@/lib/proposal-prompt";

export type ProposalResult = { ok: true; text: string } | { ok: false; error: string };

const JOB_COLUMNS = "id, platform, title, description, url, budget_str, budget_usd, skills";

export async function generateProposalAction(jobId: string): Promise<ProposalResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesion invalida." };

  // Ya generada antes: no gasta cuota, no llama a Claude de nuevo.
  const { data: existing } = await supabase
    .from("generated_proposals")
    .select("proposal_text")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) return { ok: true, text: existing.proposal_text };

  // El select en scraped_jobs solo devuelve fila si existe un
  // notifications_sent(user_id=auth.uid(), job_id) -- ver policy
  // scraped_jobs_select_notified. Esta es la autorizacion: no hace
  // falta un chequeo de "es tuyo" aparte.
  const [{ data: job }, { data: profile }] = await Promise.all([
    supabase.from("scraped_jobs").select(JOB_COLUMNS).eq("id", jobId).maybeSingle(),
    supabase.from("profiles").select("proposal_style").eq("id", user.id).maybeSingle(),
  ]);

  if (!job) return { ok: false, error: "No encontramos ese proyecto." };

  // Cuota: RPC service_role-only, invocada con el user.id verificado
  // por el server (nunca un valor que mande el cliente).
  const admin = createAdminClient();
  const { data: allowed, error: quotaError } = await admin.rpc("try_consume_generation", {
    p_user_id: user.id,
  });

  if (quotaError || !allowed) {
    return { ok: false, error: "Alcanzaste el limite de generaciones de este periodo." };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "IA no configurada (falta ANTHROPIC_API_KEY). Ya se descuento tu cuota, avisanos.",
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const prompt = buildProposalPrompt(job, DEFAULT_PROFILE, profile?.proposal_style ?? null);

  let text: string;
  try {
    const msg = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });
    const block = msg.content[0];
    text = block.type === "text" ? block.text.trim() : "";
    if (!text) throw new Error("respuesta vacia");
  } catch {
    return {
      ok: false,
      error: "Claude no pudo generar la propuesta. Ya se descuento tu cuota, intenta de nuevo mas tarde.",
    };
  }

  // ignoreDuplicates cubre el doble-tap: si dos requests corrieron en
  // paralelo, uno gana el insert, el otro relee lo que ya quedo
  // guardado en vez de fallar por la unique constraint.
  const { data: inserted } = await supabase
    .from("generated_proposals")
    .upsert(
      { user_id: user.id, job_id: jobId, proposal_text: text },
      { onConflict: "user_id,job_id", ignoreDuplicates: true },
    )
    .select("proposal_text")
    .maybeSingle();

  if (inserted) return { ok: true, text: inserted.proposal_text };

  const { data: raced } = await supabase
    .from("generated_proposals")
    .select("proposal_text")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  return { ok: true, text: raced?.proposal_text ?? text };
}
