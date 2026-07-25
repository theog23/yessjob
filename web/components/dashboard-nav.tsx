"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Resumen", exact: true },
  { href: "/dashboard/platforms", label: "Plataformas" },
  { href: "/dashboard/telegram", label: "Telegram" },
  { href: "/dashboard/subscription", label: "Suscripcion" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`border-l-2 px-4 py-2.5 font-mono text-[13px] transition-colors ${
              active
                ? "border-ink-0 text-ink-0"
                : "border-transparent text-ink-500 hover:border-ink-700 hover:text-ink-200"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
