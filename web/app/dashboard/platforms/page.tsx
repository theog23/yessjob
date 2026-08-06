import { createClient } from "@/lib/supabase/server";
import type { Sector, UserPlatform } from "@/lib/types";
import { AddFilterForm } from "./add-filter-form";
import { FilterRow } from "./filter-row";

export default async function PlatformsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: sectors }, { data: filters }, { data: plan }] = await Promise.all([
    supabase.from("sectors").select("*").order("sort_order"),
    supabase
      .from("user_platforms")
      .select("*, sectors(name)")
      .eq("user_id", user?.id ?? "")
      .order("created_at"),
    supabase
      .from("v_active_users")
      .select("plan_slug, max_platforms, max_sectors, max_keywords")
      .eq("user_id", user?.id ?? "")
      .maybeSingle(),
  ]);

  const rows = (filters as (UserPlatform & { sectors: { name: string } | null })[]) ?? [];

  return (
    <div className="animate-fadeUp">
      <p className="label-eyebrow mb-2">configuracion</p>
      <h1 className="font-serif text-3xl text-ink-0">Plataformas</h1>
      <p className="mt-2 max-w-lg text-sm text-ink-500">
        {plan ? (
          <>
            Cada combinacion de plataforma y rubro es un filtro independiente. Tu
            plan <span className="font-medium capitalize text-ink-300">{plan.plan_slug}</span>{" "}
            permite hasta {plan.max_sectors} filtro(s) y {plan.max_keywords} palabras
            clave por filtro.
          </>
        ) : (
          "Tu prueba gratuita vencio. Agrega una tarjeta desde Suscripcion para volver a configurar filtros."
        )}
      </p>

      <div className="mt-8">
        {rows.length > 0 && (
          <div className="panel mb-6 divide-y divide-ink-800 rounded-3xl">
            {rows.map((r) => (
              <FilterRow key={r.id} row={r} />
            ))}
          </div>
        )}

        <AddFilterForm sectors={(sectors as Sector[]) ?? []} />
      </div>
    </div>
  );
}
