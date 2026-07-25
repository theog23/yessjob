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
    <div className="relative min-h-screen overflow-x-clip bg-ink-950">
      <div className="blob animate-drift left-[-10%] top-[-10%] h-96 w-96 bg-ink-0/[0.04]" />
      <div className="blob animate-driftSlow right-[-15%] top-1/3 h-[28rem] w-[28rem] bg-ink-400/[0.06]" />

      <div className="relative mx-auto flex max-w-6xl">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col justify-between px-2 py-6 md:flex">
          <div>
            <Link href="/" className="mb-8 block px-4">
              <Logo />
            </Link>
            <DashboardNav />
          </div>

          <div className="space-y-4 px-2">
            <div className="glass rounded-2xl p-4">
              <p className="label-eyebrow">plan</p>
              <p className="mt-1 font-serif text-lg capitalize text-ink-0">
                {active?.plan_slug ?? "free"}
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                <span
                  className={`status-dot ${active?.telegram_chat_id ? "bg-ink-0" : "bg-ink-600"}`}
                />
                <span className="text-[11px] text-ink-500">
                  {active?.telegram_chat_id ? "Telegram conectado" : "Telegram sin conectar"}
                </span>
              </div>
            </div>

            <form action={logout}>
              <button type="submit" className="btn-ghost w-full !justify-start !px-2">
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
