import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la Service Role Key — bypassa RLS. El import "server-only"
 * hace fallar el build si este archivo termina importado desde un
 * componente "use client". Usar SOLO dentro de Server Actions o Route
 * Handlers, para lecturas puntuales que el usuario no puede hacer con
 * la anon key (ej: preview de scraped_jobs, que no tiene policies).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
