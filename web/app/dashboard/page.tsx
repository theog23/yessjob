import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { UserPlatform } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: platforms }, { data: active }, { count: notifCount }] = await Promise.all([
    supabase
      .from("user_platforms")
      .select("*, sectors(name)")
      .eq("user_id", user?.id ?? ""),
    supabase
      .from("v_active_users")
      .select("*")
      .eq("user_id", user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("notifications_sent")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user?.id ?? ""),
  ]);

  const rows = (platforms as (UserPlatform & { sectors: { name: string } | null })[]) ?? [];
  const activeCount = rows.filter((r) => r.is_active).length;

  return (
    <div className="animate-fadeUp">
      <p className="label-eyebrow mb-2">resumen</p>
      <h1 className="text-2xl font-medium tracking-tight text-ink-0">
        Hola{active?.email ? `, ${active.email.split("@")[0]}` : ""}.
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Este es el estado actual de tu monitoreo.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden border border-ink-800 bg-ink-800 sm:grid-cols-3">
        <Stat label="filtros activos" value={String(activeCount)} />
        <Stat
          label="proyectos recibidos"
          value={String(notifCount ?? 0)}
        />
        <Stat
          label="telegram"
          value={active?.telegram_chat_id ? "conectado" : "pendiente"}
          warn={!active?.telegram_chat_id}
        />
      </div>

      {!active?.telegram_chat_id && (
        <div className="mt-8 border border-ink-0 p-6">
          <p className="text-sm font-medium text-ink-0">
            Falta un paso: conecta tu Telegram
          </p>
          <p className="mt-2 text-sm text-ink-400">
            Sin Telegram vinculado no vas a recibir ninguna notificacion.
          </p>
          <Link href="/dashboard/telegram" className="btn-primary mt-4">
            Conectar ahora
          </Link>
        </div>
      )}

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <p className="label-eyebrow">tus filtros</p>
          <Link href="/dashboard/platforms" className="font-mono text-xs text-ink-400 hover:text-ink-0">
            administrar →
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="panel p-8 text-center">
            <p className="text-sm text-ink-400">
              Todavia no configuraste ninguna plataforma.
            </p>
            <Link href="/dashboard/platforms" className="btn-secondary mt-4">
              Configurar filtros
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink-800 border border-ink-800">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-mono text-xs uppercase text-ink-0">
                    {r.platform} · {r.sectors?.name ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    {r.keywords.length > 0 ? r.keywords.join(", ") : "sin keywords especificas"}
                  </p>
                </div>
                <span
                  className={`status-dot ${r.is_active ? "bg-ink-0" : "bg-ink-700"}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="bg-ink-950 p-6">
      <p className="label-eyebrow">{label}</p>
      <p className={`mt-2 font-mono text-2xl ${warn ? "text-ink-400" : "text-ink-0"}`}>
        {value}
      </p>
    </div>
  );
}
