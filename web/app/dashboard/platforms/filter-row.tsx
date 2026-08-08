"use client";

import { useTransition } from "react";
import { toggleFilter, deleteFilter } from "./actions";
import type { UserPlatform } from "@/lib/types";
import { platformFilterLabel } from "@/lib/platform-filter-label";

type Row = UserPlatform & { sectors: { name: string } | null };

export function FilterRow({ row }: { row: Row }) {
  const [isPending, startTransition] = useTransition();
  const label = platformFilterLabel(row);

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium capitalize text-ink-0">
          {row.platform}
          {label && ` · ${label}`}
        </p>
        <p className="mt-1 truncate text-xs text-ink-500">
          {row.keywords.length > 0 ? row.keywords.join(", ") : "sin palabras clave especificas"}
          {row.min_budget_usd > 0 && ` · min USD ${row.min_budget_usd}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          disabled={isPending}
          onClick={() => startTransition(() => toggleFilter(row.id, !row.is_active))}
          className={`text-xs uppercase tracking-widest2 ${
            row.is_active ? "text-ink-0" : "text-ink-600"
          }`}
        >
          {row.is_active ? "activo" : "pausado"}
        </button>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => deleteFilter(row.id))}
          className="text-ink-600 hover:text-ink-0"
          aria-label="Eliminar plataforma"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
