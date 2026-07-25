"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addFilter, type FormState } from "./actions";
import type { Sector } from "@/lib/types";

const initialState: FormState = { error: null };

export function AddFilterForm({ sectors }: { sectors: Sector[] }) {
  const [state, formAction, pending] = useActionState(addFilter, initialState);
  const [open, setOpen] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (pending) submittedRef.current = true;
    if (!pending && submittedRef.current && state.error === null) {
      submittedRef.current = false;
      setOpen(false);
    }
  }, [pending, state]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary">
        + Agregar filtro
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
      }}
      className="panel space-y-5 p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label-eyebrow mb-2 block">Plataforma</label>
          <select name="platform" required className="field-input" defaultValue="">
            <option value="" disabled>
              Elegi una plataforma
            </option>
            <option value="workana">Workana</option>
            <option value="freelancer">Freelancer.com</option>
          </select>
        </div>
        <div>
          <label className="label-eyebrow mb-2 block">Sector</label>
          <select name="sector_id" required className="field-input" defaultValue="">
            <option value="" disabled>
              Elegi un sector
            </option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label-eyebrow mb-2 block">
          Palabras clave <span className="text-ink-600">(separadas por coma)</span>
        </label>
        <input
          name="keywords"
          className="field-input"
          placeholder="react, python, automatizacion"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label-eyebrow mb-2 block">
            Excluir <span className="text-ink-600">(opcional)</span>
          </label>
          <input
            name="excluded_keywords"
            className="field-input"
            placeholder="logo, video"
          />
        </div>
        <div>
          <label className="label-eyebrow mb-2 block">Presupuesto minimo (USD)</label>
          <input
            name="min_budget_usd"
            type="number"
            min={0}
            className="field-input"
            placeholder="0"
          />
        </div>
      </div>

      {state.error && (
        <p className="border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-200">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando..." : "Guardar filtro"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}
