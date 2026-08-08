import { createClient } from "@/lib/supabase/server";
import type { Platform, Sector, UserPlatform, UserProposalStyle } from "@/lib/types";
import { AddFilterForm } from "./add-filter-form";
import { FilterRow } from "./filter-row";
import { ProposalStyleForm } from "./proposal-style-form";

const PLATFORM_ORDER: Platform[] = ["workana", "freelancer", "upwork"];

export default async function PlatformsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: sectors }, { data: filters }, { data: plan }, { data: styles }] = await Promise.all([
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
    supabase
      .from("user_proposal_styles")
      .select("platform, style")
      .eq("user_id", user?.id ?? ""),
  ]);

  const rows = (filters as (UserPlatform & { sectors: { name: string } | null })[]) ?? [];
  const stylesByPlatform = new Map((styles as UserProposalStyle[] | null)?.map((s) => [s.platform, s.style]) ?? []);
  const platformsPresent = PLATFORM_ORDER.filter((p) => rows.some((r) => r.platform === p));

  return (
    <div className="animate-fadeUp">
      <p className="label-eyebrow mb-2">configuracion</p>
      <h1 className="font-serif text-3xl text-ink-0">Plataformas</h1>
      <p className="mt-2 max-w-lg text-sm text-ink-500">
        {plan ? (
          <>
            Elige en que plataformas buscamos por ti. Por cada una defines tu
            rubro o tus skills, y las palabras clave que hacen que un proyecto
            te interese, apenas aparece te avisamos por Telegram. Tu
            plan <span className="font-medium capitalize text-ink-300">{plan.plan_slug}</span>{" "}
            te permite activar hasta {plan.max_platforms} plataformas, con hasta{" "}
            {plan.max_keywords} palabras clave por plataforma.
          </>
        ) : (
          "Tu prueba gratuita vencio. Agrega una tarjeta desde Suscripcion para volver a activar tus plataformas."
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

        <AddFilterForm sectors={(sectors as Sector[]) ?? []} maxSkills={plan?.max_keywords ?? 20} />
      </div>

      {platformsPresent.length > 0 && (
        <div className="mt-12">
          <p className="label-eyebrow mb-2">personalizacion</p>
          <h2 className="font-serif text-xl text-ink-0">Como escribe la IA tus propuestas</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Cuando generas una propuesta con IA para un proyecto, la IA usa
            exactamente lo que hayas escrito para esa plataforma: pega una
            propuesta tuya que ya te haya funcionado, o describe el saludo,
            el tono y la estructura que quieres que siga. Cada plataforma
            tiene su propio estilo, por si te conviene sonar distinto en
            cada una. Si lo dejas vacio, usamos una plantilla general.
          </p>

          <div className="mt-6 space-y-4">
            {platformsPresent.map((p) => (
              <ProposalStyleForm key={p} platform={p} initialValue={stylesByPlatform.get(p) ?? ""} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
