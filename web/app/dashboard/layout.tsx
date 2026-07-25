import Link from "next/link";
import { Logo } from "@/components/logo";
import { DashboardNav } from "@/components/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: active } = await supabase
    .from("v_active_users")
    .select("plan_slug, telegram_chat_id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="mx-auto flex max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col justify-between border-r border-ink-800 py-6 md:flex">
          <div>
            <Link href="/" className="block px-4 pb-8">
              <Logo />
            </Link>
            <DashboardNav />
          </div>

          <div className="space-y-4 px-4">
            <div className="border border-ink-800 p-3">
              <p className="label-eyebrow">plan</p>
              <p className="mt-1 font-mono text-xs uppercase text-ink-0">
                {active?.plan_slug ?? "free"}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`status-dot ${active?.telegram_chat_id ? "bg-ink-0" : "bg-ink-700"}`}
                />
                <span className="font-mono text-[11px] text-ink-500">
                  {active?.telegram_chat_id ? "telegram conectado" : "telegram sin conectar"}
                </span>
              </div>
            </div>

            <form action={logout}>
              <button type="submit" className="btn-ghost w-full !justify-start !px-0">
                Cerrar sesion
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-6 py-10 md:px-10">{children}</main>
      </div>
    </div>
  );
}
