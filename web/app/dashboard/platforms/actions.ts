"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type FormState = { error: string | null };

function parseKeywords(raw: string): string[] {
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 50);
}

type PreviewSourceJob = {
  title: string;
  description: string | null;
  skills: string[] | null;
  budget_str: string | null;
  budget_usd: number | null;
  url: string;
};

function matchesPreview(
  job: PreviewSourceJob,
  keywords: string[],
  excluded: string[],
  minBudget: number,
): boolean {
  const text = `${job.title} ${job.description ?? ""} ${(job.skills ?? []).join(" ")}`.toLowerCase();
  for (const k of excluded) {
    if (k && text.includes(k.toLowerCase())) return false;
  }
  if (minBudget > 0 && (job.budget_usd ?? 0) > 0 && (job.budget_usd as number) < minBudget) {
    return false;
  }
  const kws = keywords.filter(Boolean);
  if (kws.length === 0) return true;
  return kws.some((k) => text.includes(k.toLowerCase()));
}

export type PreviewJob = { title: string; budget_str: string | null; url: string };
export type PreviewState = { jobs: PreviewJob[]; error: string | null };

/**
 * Preview instantaneo: busca en lo ya scrapeado (ultimos 7 dias) que
 * coincidiria con estos filtros, sin esperar al proximo ciclo del worker.
 * Best-effort — si nadie scrapeo todavia esa plataforma no hay nada que
 * mostrar, no significa que el filtro este mal.
 */
export async function previewMatches(formData: FormData): Promise<PreviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { jobs: [], error: "Sesion invalida." };

  const platform = String(formData.get("platform") ?? "");
  if (platform !== "workana" && platform !== "freelancer" && platform !== "upwork") {
    return { jobs: [], error: null };
  }

  const keywords = parseKeywords(String(formData.get("keywords") ?? ""));
  const excluded = parseKeywords(String(formData.get("excluded_keywords") ?? ""));
  const minBudget = Number(formData.get("min_budget_usd") ?? 0) || 0;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await createAdminClient()
    .from("scraped_jobs")
    .select("title, description, skills, budget_str, budget_usd, url")
    .eq("platform", platform)
    .gte("scraped_at", since)
    .order("scraped_at", { ascending: false })
    .limit(300);

  if (error) return { jobs: [], error: "No se pudieron cargar ejemplos." };

  const jobs = (data ?? [])
    .filter((j) => matchesPreview(j, keywords, excluded, minBudget))
    .slice(0, 5)
    .map((j) => ({ title: j.title, budget_str: j.budget_str, url: j.url }));

  return { jobs, error: null };
}

export async function addFilter(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesion invalida." };

  const platform = String(formData.get("platform") ?? "");
  const sectorId = String(formData.get("sector_id") ?? "");
  const skillIdsRaw = String(formData.get("freelancer_skill_ids") ?? "");
  const keywords = parseKeywords(String(formData.get("keywords") ?? ""));
  const excluded = parseKeywords(String(formData.get("excluded_keywords") ?? ""));
  const minBudget = Number(formData.get("min_budget_usd") ?? 0) || 0;

  if (platform !== "workana" && platform !== "freelancer" && platform !== "upwork") {
    return { error: "Elegi una plataforma valida." };
  }

  if (platform === "workana" && !sectorId) {
    return { error: "Elegi un sector." };
  }

  const skillIds = skillIdsRaw
    ? skillIdsRaw
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n))
        .slice(0, 200)
    : [];

  if (platform === "freelancer" && skillIds.length === 0) {
    return { error: "Elegi al menos un skill." };
  }

  const { data: plan } = await supabase
    .from("v_active_users")
    .select("max_platforms, max_sectors, max_keywords")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!plan) {
    return { error: "Tu suscripcion no esta activa." };
  }

  const { data: existing } = await supabase
    .from("user_platforms")
    .select("id, platform")
    .eq("user_id", user.id);

  const distinctPlatforms = new Set((existing ?? []).map((r) => r.platform));
  distinctPlatforms.add(platform);
  if (distinctPlatforms.size > plan.max_platforms) {
    return { error: `Tu plan permite hasta ${plan.max_platforms} plataforma(s).` };
  }

  if ((existing?.length ?? 0) >= plan.max_sectors) {
    return { error: `Tu plan permite hasta ${plan.max_sectors} filtro(s).` };
  }

  if (keywords.length > plan.max_keywords) {
    return { error: `Tu plan permite hasta ${plan.max_keywords} keywords.` };
  }

  if (platform === "freelancer" && skillIds.length > plan.max_keywords) {
    return { error: `Tu plan permite hasta ${plan.max_keywords} skills.` };
  }

  const { error } = await supabase.from("user_platforms").insert({
    user_id: user.id,
    platform,
    sector_id: platform === "workana" ? sectorId : null,
    freelancer_skill_ids: platform === "freelancer" ? skillIds : null,
    keywords,
    excluded_keywords: excluded,
    min_budget_usd: minBudget,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya tenes un filtro igual para esa plataforma." };
    }
    if (error.code === "23514") {
      return { error: "Faltan datos requeridos para esa plataforma." };
    }
    return { error: "No se pudo guardar el filtro." };
  }

  revalidatePath("/dashboard/platforms");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function toggleFilter(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("user_platforms").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/dashboard/platforms");
  revalidatePath("/dashboard");
}

export async function deleteFilter(id: string) {
  const supabase = await createClient();
  await supabase.from("user_platforms").delete().eq("id", id);
  revalidatePath("/dashboard/platforms");
  revalidatePath("/dashboard");
}

export type ProposalStyleState = { error: string | null; success?: boolean };

const MAX_STYLE_LEN = 3000;

export async function updateProposalStyle(
  platform: string,
  _prev: ProposalStyleState,
  formData: FormData,
): Promise<ProposalStyleState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesion invalida." };

  const raw = String(formData.get("style") ?? "").trim();
  if (raw.length > MAX_STYLE_LEN) {
    return { error: `Maximo ${MAX_STYLE_LEN} caracteres.` };
  }

  const { error } = await supabase.from("user_proposal_styles").upsert(
    { user_id: user.id, platform, style: raw || null, updated_at: new Date().toISOString() },
    { onConflict: "user_id,platform" },
  );

  if (error) return { error: "No se pudo guardar." };

  revalidatePath("/dashboard/platforms");
  return { error: null, success: true };
}
