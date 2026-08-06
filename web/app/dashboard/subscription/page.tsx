import { createClient } from "@/lib/supabase/server";
import type { GenerationBalance, GenerationPurchase } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: sub }, { data: balanceRows }, { data: purchases }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, starts_at, expires_at, current_period_start, plans(name, price_usd, max_platforms, min_scrape_interval_min)")
      .eq("user_id", user?.id ?? "")
      .maybeSingle(),
    supabase.rpc("get_generation_balance", { p_user_id: user?.id ?? "" }),
    supabase
      .from("generation_purchases")
      .select("id, quantity, remaining, purchased_at, expires_at")
      .eq("user_id", user?.id ?? "")
      .gt("remaining", 0)
      .order("purchased_at", { ascending: true }),
  ]);

  const balance = (balanceRows as GenerationBalance[] | null)?.[0];
  const purchaseRows = (purchases as GenerationPurchase[] | null) ?? [];
  const plan = (sub as unknown as { plans: { name: string; price_usd: number; max_platforms: number; min_scrape_interval_min: number } | null } | null)?.plans;

  const now = Date.now();
  const expiresAt = sub?.expires_at ? new Date(sub.expires_at).getTime() : null;
  const isCutOff = !sub || sub.status !== "active" || (expiresAt !== null && expiresAt <= now);
  const isTrial = !isCutOff && expiresAt !== null;

  return (
    <div className="animate-fadeUp">
      <p className="label-eyebrow mb-2">cuenta</p>
      <h1 className="font-serif text-3xl text-ink-0">Suscripcion</h1>

      <div className="mt-8">
        {isCutOff && (
          <div className="panel rounded-3xl border border-ink-700 p-6">
            <p className="label-eyebrow">tu prueba termino</p>
            <p className="mt-3 text-lg text-ink-0">
              Tu prueba gratuita de 15 dias termino y tu cuenta esta pausada. Agrega
              una tarjeta para reactivarla y seguir recibiendo avisos de Workana,
              Freelancer.com y Upwork.
            </p>
            <p className="mt-4 text-sm text-ink-500">
              Los pagos todavia se gestionan manualmente. Escribinos para activar
              tu plan Pro.
            </p>
          </div>
        )}

        {isTrial && sub?.expires_at && (
          <div className="glass-dark rounded-3xl p-6">
            <p className="label-eyebrow !text-ink-600">prueba gratuita</p>
            <p className="mt-3 font-serif text-2xl text-ink-950">
              Quedan {daysUntil(sub.expires_at)} dias
            </p>
            <p className="mt-2 text-sm text-ink-700">
              Tu prueba de Pro termina el {formatDate(sub.expires_at)}. No hace
              falta ninguna tarjeta hasta esa fecha.
            </p>
          </div>
        )}

        {!isCutOff && !isTrial && (
          <div className="panel rounded-3xl p-6">
            <p className="label-eyebrow">plan actual</p>
            <p className="mt-2 font-serif text-3xl text-ink-0">Pro activo</p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="panel rounded-3xl p-6">
          <p className="label-eyebrow">generaciones ia este mes</p>
          <p className="mt-2 font-serif text-3xl text-ink-0">
            {balance?.base_used ?? 0}
            <span className="text-ink-500">/{balance?.base_limit ?? 100}</span>
          </p>
          {(balance?.purchased_remaining ?? 0) > 0 && (
            <p className="mt-2 text-xs text-ink-500">
              + {balance?.purchased_remaining} compradas disponibles
              {purchaseRows[0] && ` (vencen ${formatDate(purchaseRows[0].expires_at)})`}
            </p>
          )}
          <p className="mt-3 text-xs text-ink-500">
            Se reinician cada mes, no se acumulan de un periodo a otro.
          </p>
        </div>

        <div className="panel flex flex-col justify-between rounded-3xl p-6">
          <div>
            <p className="label-eyebrow">necesitas mas</p>
            <p className="mt-2 font-serif text-2xl text-ink-0">+100 por USD 2</p>
            <p className="mt-2 text-xs text-ink-500">
              Se acumulan con lo que ya tengas. Cada compra vence a los 3 meses.
            </p>
          </div>
          <button
            disabled
            className="btn-secondary mt-4 w-full opacity-50 cursor-not-allowed"
          >
            Proximamente
          </button>
        </div>
      </div>

      <div className="mt-12">
        <p className="label-eyebrow mb-4">tu plan</p>
        <div className="panel rounded-3xl p-6">
          <p className="font-serif text-2xl text-ink-0">{plan?.name ?? "Pro"}</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-500">
            <li>USD {plan?.price_usd ?? 10}/mes</li>
            <li>{plan?.max_platforms ?? 3} plataformas: Workana, Freelancer.com y Upwork</li>
            <li>
              Avisos cada{" "}
              {(plan?.min_scrape_interval_min ?? 1) === 1
                ? "minuto"
                : `${plan?.min_scrape_interval_min} min`}
            </li>
          </ul>
        </div>
        <p className="mt-6 text-xs text-ink-500">
          Los cambios de plan todavia se gestionan manualmente. Escribinos
          para actualizar el tuyo.
        </p>
      </div>
    </div>
  );
}
