"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function generateLinkToken(): Promise<
  { token: string; error?: undefined } | { token?: undefined; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesion invalida." };

  const token = randomBytes(16).toString("base64url");

  const { error } = await supabase
    .from("telegram_link_tokens")
    .insert({ token, user_id: user.id });

  if (error) return { error: "No se pudo generar el token de vinculacion." };

  return { token };
}

export async function unlinkTelegram() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("telegram_links").delete().eq("user_id", user.id);
  revalidatePath("/dashboard/telegram");
  revalidatePath("/dashboard");
}
