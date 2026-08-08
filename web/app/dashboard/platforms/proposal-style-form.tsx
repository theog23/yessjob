"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProposalStyle, type ProposalStyleState } from "./actions";
import type { Platform } from "@/lib/types";

const PLATFORM_LABEL: Record<Platform, string> = {
  workana: "Workana",
  freelancer: "Freelancer.com",
  upwork: "Upwork",
};

const initialState: ProposalStyleState = { error: null };

export function ProposalStyleForm({
  platform,
  initialValue,
}: {
  platform: Platform;
  initialValue: string;
}) {
  const boundAction = updateProposalStyle.bind(null, platform);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!pending && state.success) {
      setSavedFlash(true);
      const t = setTimeout(() => setSavedFlash(false), 2500);
      return () => clearTimeout(t);
    }
  }, [pending, state]);

  return (
    <form action={formAction} className="panel space-y-4 rounded-3xl p-6">
      <div>
        <label className="label-eyebrow mb-2 block">{PLATFORM_LABEL[platform]}</label>
        <textarea
          name="style"
          defaultValue={initialValue}
          rows={6}
          className="field-input resize-y"
          placeholder={
            "Pega una propuesta tuya que te haya funcionado en " +
            PLATFORM_LABEL[platform] +
            ", o describe como te gusta estructurarlas ahi."
          }
        />
        <p className="mt-2 text-xs text-ink-500">
          Si dejas esto vacio, usamos una plantilla general para {PLATFORM_LABEL[platform]}.
        </p>
      </div>

      {state.error && (
        <p className="rounded-2xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-300">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn-secondary">
          {pending ? "Guardando..." : "Guardar estilo"}
        </button>
        {savedFlash && <span className="text-sm text-ink-500">Guardado.</span>}
      </div>
    </form>
  );
}
