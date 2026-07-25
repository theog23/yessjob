"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

function parseKeywords(raw: string): string[] {
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export async function addFilter(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesion invalida." };

  const platform = String(formData.get("platform") ?? "");
  const sectorId = String(formData.get("sector_id") ?? "");
  const keywords = parseKeywords(String(formData.get("keywords") ?? ""));
  const excluded = parseKeywords(String(formData.get("excluded_keywords") ?? ""));
  const minBudget = Number(formData.get("min_budget_usd") ?? 0) || 0;

  if (!platform || !sectorId) {
    return { error: "Elegi una plataforma y un sector." };
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
    .select("id, platform, sector_id")
    .eq("user_id", user.id);

  const distinctPlatforms = new Set((existing ?? []).map((r) => r.platform));
  distinctPlatforms.add(platform);
  if (distinctPlatforms.size > plan.max_platforms) {
    return { error: `Tu plan permite hasta ${plan.max_platforms} plataforma(s).` };
  }

  if ((existing?.length ?? 0) >= plan.max_sectors) {
    return { error: `Tu plan permite hasta ${plan.max_sectors} combinacion(es) de sector.` };
  }

  if (keywords.length > plan.max_keywords) {
    return { error: `Tu plan permite hasta ${plan.max_keywords} keywords.` };
  }

  const { error } = await supabase.from("user_platforms").insert({
    user_id: user.id,
    platform,
    sector_id: sectorId,
    keywords,
    excluded_keywords: excluded,
    min_budget_usd: minBudget,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya tenes un filtro para esa plataforma y sector." };
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
