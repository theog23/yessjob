import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: active }, { data: plans }, { count: usedToday }] = await Promise.all([
    supabase
      .from("v_active_users")
      .select("*")
      .eq("user_id", user?.id ?? "")
      .maybeSingle(),
    supabase.from("plans").select("*").eq("is_active", true).order("price_usd"),
    supabase
      .from("usage_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user?.id ?? "")
      .eq("action", "proposal_generated")
      .gte("created_at", since),
  ]);

  const allPlans = (plans as Plan[]) ?? [];

  return (
    <div className="animate-fadeUp">
      <p className="label-eyebrow mb-2">cuenta</p>
      <h1 className="font-serif text-3xl text-ink-0">Suscripcion</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="panel rounded-3xl p-6">
          <p className="label-eyebrow">plan actual</p>
          <p className="mt-2 font-serif text-3xl capitalize text-ink-0">
            {active?.plan_slug ?? "free"}
          </p>
        </div>
        <div className="panel rounded-3xl p-6">
          <p className="label-eyebrow">propuestas asistidas hoy</p>
          <p className="mt-2 font-serif text-3xl text-ink-0">
            {usedToday ?? 0}
            <span className="text-ink-500">
              /{active && active.max_proposals_per_day >= 999 ? "∞" : active?.max_proposals_per_day ?? "-"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-12">
        <p className="label-eyebrow mb-4">todos los planes</p>
        <div className="grid gap-5 md:grid-cols-3">
          {allPlans.map((p) => {
            const isCurrent = p.slug === active?.plan_slug;
            return (
              <div
                key={p.id}
                className={`rounded-3xl p-6 ${isCurrent ? "glass-dark" : "panel"}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`label-eyebrow ${isCurrent ? "!text-ink-600" : ""}`}>{p.name}</p>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-widest2 text-ink-950">
                      actual
                    </span>
                  )}
                </div>
                <p
                  className={`mt-3 font-serif text-2xl ${isCurrent ? "text-ink-950" : "text-ink-0"}`}
                >
                  {p.price_usd === 0 ? "Gratis" : `USD ${p.price_usd}`}
                </p>
                <ul
                  className={`mt-5 space-y-2 text-xs ${isCurrent ? "text-ink-700" : "text-ink-500"}`}
                >
                  <li>{p.max_platforms} plataforma(s)</li>
                  <li>{p.max_sectors} rubro(s)</li>
                  <li>{p.max_keywords} palabras clave</li>
                  <li>Avisos cada {p.min_scrape_interval_min} min</li>
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-xs text-ink-500">
          Los cambios de plan todavia se gestionan manualmente. Escribinos
          para actualizar el tuyo.
        </p>
      </div>
    </div>
  );
}
