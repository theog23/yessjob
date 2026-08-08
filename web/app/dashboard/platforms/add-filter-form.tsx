"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addFilter, previewMatches, type FormState, type PreviewJob } from "./actions";
import type { Platform, Sector } from "@/lib/types";
import { SkillPicker } from "./skill-picker";
import { SelectDropdown } from "./select-dropdown";

const initialState: FormState = { error: null };

const PLATFORM_OPTIONS = [
  { value: "workana", label: "Workana" },
  { value: "freelancer", label: "Freelancer.com" },
  { value: "upwork", label: "Upwork" },
];

export function AddFilterForm({ sectors, maxSkills }: { sectors: Sector[]; maxSkills: number }) {
  const [state, formAction, pending] = useActionState(addFilter, initialState);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform | "">("");
  const [sectorId, setSectorId] = useState("");
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
      setPlatform("");
      setSectorId("");
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
        + Agregar plataforma
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
      <div className={`grid gap-5 ${platform === "upwork" ? "" : "sm:grid-cols-2"}`}>
        <div>
          <label className="label-eyebrow mb-2 block">Plataforma</label>
          <SelectDropdown
            name="platform"
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={(v) => {
              setPlatform(v as Platform);
              setSectorId("");
            }}
            placeholder="Elige una plataforma"
          />
        </div>

        {platform === "workana" && (
          <div>
            <label className="label-eyebrow mb-2 block">Sector</label>
            <SelectDropdown
              name="sector_id"
              options={sectors.map((s) => ({ value: s.id, label: s.name }))}
              value={sectorId}
              onChange={setSectorId}
              placeholder="Elige un sector"
            />
          </div>
        )}
      </div>

      {platform === "freelancer" && <SkillPicker key="freelancer-skills" maxSkills={maxSkills} />}

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
          {pending ? "Guardando..." : "Guardar plataforma"}
        </button>
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewLoading}
          className="btn-secondary"
        >
          {previewLoading ? "Buscando ejemplos..." : "Ver ejemplos que coinciden"}
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
              Sin ejemplos recientes para estos criterios todavia. Eso no
              significa que este mal, apenas empecemos a monitorear te va
              a llegar el primero.
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
