import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-grid relative flex min-h-screen items-center justify-center bg-ink-950 px-6 py-16">
      <div className="absolute left-0 top-0 w-full border-b border-ink-800 p-6">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <div className="w-full max-w-sm animate-fadeUp">{children}</div>
    </main>
  );
}
