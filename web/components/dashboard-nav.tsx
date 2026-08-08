"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Resumen", exact: true },
  { href: "/dashboard/jobs", label: "Trabajos" },
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
            className={`rounded-full px-4 py-2.5 text-sm transition-all ${
              active
                ? "glass font-medium text-ink-0"
                : "text-ink-500 hover:text-ink-0"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
