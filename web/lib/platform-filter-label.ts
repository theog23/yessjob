import type { UserPlatform } from "@/lib/types";

type FilterRow = UserPlatform & { sectors: { name: string } | null };

/**
 * Cada plataforma se filtra distinto: Workana por sector, Freelancer.com
 * por skills individuales, Upwork sin ninguno de los dos (su busqueda
 * publica no soporta filtrar por categoria).
 */
export function platformFilterLabel(row: FilterRow): string | null {
  if (row.platform === "workana") return row.sectors?.name ?? "—";
  if (row.platform === "freelancer") {
    const count = row.freelancer_skill_ids?.length ?? 0;
    return count === 1 ? "1 skill seleccionado" : `${count} skills seleccionados`;
  }
  return null;
}
