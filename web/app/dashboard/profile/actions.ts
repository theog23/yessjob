"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error: string | null; success?: boolean };

const MAX_LEN = 3000;

export async function updateProposalStyle(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesion invalida." };

  const raw = String(formData.get("proposal_style") ?? "").trim();
  if (raw.length > MAX_LEN) {
    return { error: `Maximo ${MAX_LEN} caracteres.` };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ proposal_style: raw || null })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar." };

  revalidatePath("/dashboard/profile");
  return { error: null, success: true };
}
