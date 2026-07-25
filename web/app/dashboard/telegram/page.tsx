import { createClient } from "@/lib/supabase/server";
import { LinkPanel } from "./link-panel";
import { UnlinkButton } from "./unlink-button";

export default async function TelegramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: link } = await supabase
    .from("telegram_links")
    .select("chat_id, username, linked_at")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="animate-fadeUp max-w-xl">
      <p className="label-eyebrow mb-2">notificaciones</p>
      <h1 className="text-2xl font-medium tracking-tight text-ink-0">Telegram</h1>
      <p className="mt-2 text-sm text-ink-500">
        Recibis cada proyecto nuevo directo en tu chat, con boton para generar
        una propuesta con IA.
      </p>

      <div className="mt-8">
        {link ? (
          <div className="panel p-6">
            <div className="flex items-center gap-2">
              <span className="status-dot bg-ink-0" />
              <p className="text-sm text-ink-0">Cuenta vinculada</p>
            </div>
            {link.username && (
              <p className="mt-2 font-mono text-xs text-ink-500">@{link.username}</p>
            )}
            <p className="mt-1 font-mono text-xs text-ink-600">
              desde {new Date(link.linked_at).toLocaleDateString("es")}
            </p>
            <div className="mt-4">
              <UnlinkButton />
            </div>
          </div>
        ) : (
          <LinkPanel />
        )}
      </div>
    </div>
  );
}
