import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-6 py-16">
      <div className="blob animate-drift left-[-10%] top-[-10%] h-96 w-96 bg-ink-0/[0.05]" />
      <div className="blob animate-driftSlow bottom-[-15%] right-[-10%] h-[28rem] w-[28rem] bg-ink-400/[0.08]" />

      <div className="absolute left-0 top-0 w-full p-6">
        <Link href="/">
          <Logo />
        </Link>
      </div>

      <div className="glass w-full max-w-sm animate-fadeUp rounded-3xl p-8">{children}</div>
    </main>
  );
}
