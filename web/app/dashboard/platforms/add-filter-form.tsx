"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addFilter, previewMatches, type FormState, type PreviewJob } from "./actions";
import type { Sector } from "@/lib/types";

const initialState: FormState = { error: null };

export function AddFilterForm({ sectors }: { sectors: Sector[] }) {
  const [state, formAction, pending] = useActionState(addFilter, initialState);
  const [open, setOpen] = useState(false);
  const submittedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [previewJobs, setPreviewJobs] = useState<PreviewJob[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (pending) submittedRef.current = true;
    if (!pending && submittedRef.current && state.error === null) {
      submittedRef.current = false;
      setOpen(false);
    }
  }, [pending, state]);

  async function handlePreview() {
    if (!formRef.current) return;
    setPreviewLoading(true);
    setPreviewError(null);
    const fd = new FormData(formRef.current);
    const result = await previewMatches(fd);
    setPreviewLoading(false);
    if (result.error) {
      setPreviewError(result.error);
      setPreviewJobs(null);
      return;
    }
    setPreviewJobs(result.jobs);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary">
        + Agregar filtro
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await formAction(fd);
      }}
      className="panel space-y-5 rounded-3xl p-6"
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
        <p className="rounded-2xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-300">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando..." : "Guardar filtro"}
        </button>
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewLoading}
          className="btn-secondary"
        >
          {previewLoading ? "Buscando ejemplos..." : "Ver ejemplos con estos filtros"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          Cancelar
        </button>
      </div>

      {previewError && (
        <p className="rounded-2xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-300">
          {previewError}
        </p>
      )}

      {previewJobs && (
        <div className="space-y-2 border-t border-ink-800 pt-5">
          <p className="label-eyebrow">
            {previewJobs.length > 0
              ? `${previewJobs.length} ejemplo(s) de lo ultimo scrapeado`
              : "ejemplos"}
          </p>
          {previewJobs.length === 0 ? (
            <p className="text-sm text-ink-500">
              Sin ejemplos recientes para estos filtros todavia. Eso no
              significa que este mal — apenas empecemos a monitorear tu
              sector te va a llegar el primero.
            </p>
          ) : (
            <ul className="space-y-2">
              {previewJobs.map((j, i) => (
                <li key={i} className="rounded-2xl border border-ink-800 px-4 py-3">
                  <p className="text-sm text-ink-0">{j.title}</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="text-xs text-ink-500">
                      {j.budget_str || "Presupuesto no especificado"}
                    </span>
                    <a
                      href={j.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ink-0 underline underline-offset-4"
                    >
                      Ver proyecto
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
