import { createClient } from "@/lib/supabase/server";
import type { GeneratedProposal, NotifiedJob, ScrapedJob } from "@/lib/types";
import { JobsFeed } from "./jobs-feed";

const JOB_COLUMNS = "id, platform, title, description, url, budget_str, budget_usd, skills, posted_at";

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notified } = await supabase
    .from("notifications_sent")
    .select(`sent_at, scraped_jobs(${JOB_COLUMNS})`)
    .eq("user_id", user?.id ?? "")
    .order("sent_at", { ascending: false })
    .limit(50);

  // Supabase (sin tipos generados de la base) infiere el embed como
  // array aunque en runtime notifications_sent.job_id -> scraped_jobs.id
  // es siempre un solo objeto (many-to-one). Se corrige con una
  // aserción, mismo patron que ya se uso en dashboard/subscription.
  const rows =
    (notified as unknown as { sent_at: string; scraped_jobs: ScrapedJob | null }[]) ?? [];

  // El filter defensivo cubre el caso (nunca deberia pasar) de que el
  // embed de scraped_jobs venga null: como ambas RLS dependen de la
  // misma fila de notifications_sent, si la notificacion existe el job
  // embebido siempre existe tambien.
  const jobs: NotifiedJob[] = rows
    .filter((n): n is { sent_at: string; scraped_jobs: ScrapedJob } => n.scraped_jobs !== null)
    .map((n) => ({ ...n.scraped_jobs, sent_at: n.sent_at }));

  const jobIds = jobs.map((j) => j.id);
  const { data: proposals } = jobIds.length
    ? await supabase
        .from("generated_proposals")
        .select("job_id, proposal_text, created_at")
        .eq("user_id", user?.id ?? "")
        .in("job_id", jobIds)
    : { data: [] as GeneratedProposal[] };

  return (
    <div className="animate-fadeUp">
      <p className="label-eyebrow mb-2">oportunidades</p>
      <h1 className="font-serif text-3xl text-ink-0">Trabajos</h1>
      <p className="mt-2 max-w-lg text-sm text-ink-500">
        Los mismos proyectos que recibes por Telegram, actualizados en tiempo real.
      </p>

      <div className="mt-8">
        <JobsFeed
          userId={user?.id ?? ""}
          initialJobs={jobs}
          initialProposals={(proposals as GeneratedProposal[]) ?? []}
        />
      </div>
    </div>
  );
}
