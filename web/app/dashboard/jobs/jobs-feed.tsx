"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateProposalAction } from "./actions";
import type { GeneratedProposal, NotifiedJob, Platform } from "@/lib/types";

const PLATFORM_LABEL: Record<Platform, string> = {
  workana: "Workana",
  freelancer: "Freelancer.com",
  upwork: "Upwork",
};

const PLATFORM_ORDER: Platform[] = ["workana", "freelancer", "upwork"];

const JOB_COLUMNS = "id, platform, title, description, url, budget_str, budget_usd, skills, posted_at";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type JobsFeedProps = {
  userId: string;
  initialJobs: NotifiedJob[];
  initialProposals: GeneratedProposal[];
};

export function JobsFeed({ userId, initialJobs, initialProposals }: JobsFeedProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [proposals, setProposals] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialProposals.map((p) => [p.job_id, p.proposal_text])),
  );
  const [hiddenPlatforms, setHiddenPlatforms] = useState<Set<Platform>>(() => new Set());

  // Se calcula sobre `jobs` completo (no sobre lo ya filtrado) para que un
  // chip no desaparezca de golpe justo cuando se lo clickea.
  const platformsPresent = useMemo(() => {
    const present = new Set<Platform>(jobs.map((j) => j.platform));
    return PLATFORM_ORDER.filter((p) => present.has(p));
  }, [jobs]);

  const visibleJobs = useMemo(
    () => jobs.filter((j) => !hiddenPlatforms.has(j.platform)),
    [jobs, hiddenPlatforms],
  );

  function togglePlatform(platform: Platform) {
    setHiddenPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  }

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // createBrowserClient no sincroniza el token de la sesion con el
    // cliente de Realtime automaticamente -- sin esto, Realtime evalua
    // la RLS como usuario anonimo y filtra todos los eventos en
    // silencio (el canal igual queda en estado SUBSCRIBED, pero nunca
    // llega nada).
    async function connect() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session) return;
      supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications_sent", filter: `user_id=eq.${userId}` },
          async (payload) => {
            const jobId = payload.new.job_id as string;
            const sentAt = payload.new.sent_at as string;
            const { data: job } = await supabase
              .from("scraped_jobs")
              .select(JOB_COLUMNS)
              .eq("id", jobId)
              .maybeSingle();
            if (!job) return;
            setJobs((prev) => (prev.some((j) => j.id === jobId) ? prev : [{ ...job, sent_at: sentAt }, ...prev]));
          },
        )
        .subscribe();
    }
    connect();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  if (jobs.length === 0) {
    return (
      <div className="panel rounded-3xl p-8 text-center">
        <p className="text-sm text-ink-500">
          Todavia no te llego ningun proyecto. En cuanto el sistema encuentre
          uno que coincida con tus filtros, aparece aca al instante.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {platformsPresent.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {platformsPresent.map((p) => {
            const active = !hiddenPlatforms.has(p);
            return (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`glass rounded-full px-4 py-1.5 text-xs transition-opacity ${
                  active ? "text-ink-0" : "text-ink-600 opacity-60"
                }`}
              >
                {PLATFORM_LABEL[p]}
              </button>
            );
          })}
        </div>
      )}

      {visibleJobs.length === 0 ? (
        <div className="panel rounded-3xl p-8 text-center">
          <p className="text-sm text-ink-500">
            No hay proyectos para las plataformas seleccionadas.
          </p>
          <button onClick={() => setHiddenPlatforms(new Set())} className="btn-secondary mt-4">
            Mostrar todas
          </button>
        </div>
      ) : (
        visibleJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            proposalText={proposals[job.id] ?? null}
            onGenerated={(text) => setProposals((prev) => ({ ...prev, [job.id]: text }))}
          />
        ))
      )}
    </div>
  );
}

function JobCard({
  job,
  proposalText,
  onGenerated,
}: {
  job: NotifiedJob;
  proposalText: string | null;
  onGenerated: (text: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateProposalAction(job.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onGenerated(result.text);
      setOpen(true);
    });
  }

  return (
    <div className="panel animate-fadeUp rounded-3xl p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-eyebrow">{PLATFORM_LABEL[job.platform]}</span>
        <span className="text-xs text-ink-600">· {formatDate(job.sent_at)}</span>
      </div>

      <h3 className="mt-2 font-serif text-xl text-ink-0">{job.title}</h3>

      {job.description && <p className="mt-2 line-clamp-3 text-sm text-ink-500">{job.description}</p>}

      {job.skills && job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {job.skills.slice(0, 8).map((s) => (
            <span key={s} className="glass rounded-full px-3 py-1 text-xs text-ink-500">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink-500">{job.budget_str || "Presupuesto no especificado"}</span>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink-0 underline underline-offset-4"
        >
          Ver en {PLATFORM_LABEL[job.platform]}
        </a>
      </div>

      <div className="mt-5 border-t border-ink-800 pt-5">
        {!proposalText && (
          <button onClick={handleGenerate} disabled={isPending} className="btn-primary">
            {isPending ? "Generando..." : "Generar propuesta"}
          </button>
        )}

        {proposalText && !open && (
          <button onClick={() => setOpen(true)} className="btn-secondary">
            Ver propuesta generada
          </button>
        )}

        {error && (
          <p className="mt-3 rounded-2xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-300">
            {error}
          </p>
        )}

        {proposalText && open && (
          <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-ink-800 bg-white/60 p-4 text-sm text-ink-0">
            {proposalText}
          </div>
        )}
      </div>
    </div>
  );
}
