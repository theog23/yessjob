"use client";

import { useTransition } from "react";
import { unlinkTelegram } from "./actions";

export function UnlinkButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => unlinkTelegram())}
      className="btn-secondary"
    >
      {isPending ? "Desvinculando..." : "Desvincular"}
    </button>
  );
}
