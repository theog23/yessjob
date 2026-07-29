"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProposalStyle, type ProfileFormState } from "./actions";

const initialState: ProfileFormState = { error: null };

export function StyleForm({ initialValue }: { initialValue: string }) {
  const [state, formAction, pending] = useActionState(updateProposalStyle, initialState);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!pending && state.success) {
      setSavedFlash(true);
      const t = setTimeout(() => setSavedFlash(false), 2500);
      return () => clearTimeout(t);
    }
  }, [pending, state]);

  return (
    <form action={formAction} className="panel space-y-5 rounded-3xl p-6">
      <div>
        <label className="label-eyebrow mb-2 block">
          Tu estilo de propuesta <span className="text-ink-600">(opcional)</span>
        </label>
        <textarea
          name="proposal_style"
          defaultValue={initialValue}
          rows={10}
          className="field-input resize-y"
          placeholder={
            "Pega una propuesta tuya que te haya funcionado, o describe como te gusta " +
            "estructurarlas: como saludas, que mencionas primero, que tono usas, como cerras."
          }
        />
        <p className="mt-2 text-xs text-ink-500">
          Si dejas esto vacio, usamos una plantilla general. Si lo completas, la IA
          va a seguir tu forma en vez de la plantilla por defecto.
        </p>
      </div>

      {state.error && (
        <p className="rounded-2xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-300">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando..." : "Guardar estilo"}
        </button>
        {savedFlash && <span className="text-sm text-ink-500">Guardado.</span>}
      </div>
    </form>
  );
}
