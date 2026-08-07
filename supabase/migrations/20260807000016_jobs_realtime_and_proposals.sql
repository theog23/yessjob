-- ============================================================
--  Pagina "Trabajos": lectura scoped de scraped_jobs via la
--  relacion notifications_sent, Realtime en notifications_sent,
--  y tabla para persistir propuestas generadas desde el dashboard.
-- ============================================================

-- --------------------------------------------------------
-- A. scraped_jobs: lectura scoped a los jobs que el usuario ya
--    recibio. notifications_sent solo lo escribe el worker
--    (service role) -- no hay policy de insert para 'authenticated',
--    asi que nadie puede fabricar la relacion para verse jobs ajenos.
-- --------------------------------------------------------
drop policy if exists "scraped_jobs_select_notified" on public.scraped_jobs;
create policy "scraped_jobs_select_notified" on public.scraped_jobs
  for select using (
    exists (
      select 1 from public.notifications_sent ns
      where ns.job_id = scraped_jobs.id and ns.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- B. Realtime en notifications_sent (solo INSERT importa aca).
--    La autorizacion la sigue dando notif_select_own -- Realtime
--    evalua esa RLS por cada subscriptor. Replica identity default
--    (primary key) ya manda la fila completa en INSERT, no hace
--    falta tocarla.
-- --------------------------------------------------------
alter publication supabase_realtime add table public.notifications_sent;

-- --------------------------------------------------------
-- C. generated_proposals: persiste el texto para no re-cobrar
--    cuota si el usuario vuelve a abrir el mismo job.
-- --------------------------------------------------------
create table if not exists public.generated_proposals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  job_id         uuid not null references public.scraped_jobs(id) on delete cascade,
  proposal_text  text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, job_id)
);

create index if not exists idx_generated_proposals_user
  on public.generated_proposals(user_id, created_at desc);

alter table public.generated_proposals enable row level security;

drop policy if exists "gen_proposals_select_own" on public.generated_proposals;
create policy "gen_proposals_select_own" on public.generated_proposals
  for select using (auth.uid() = user_id);

drop policy if exists "gen_proposals_insert_own" on public.generated_proposals;
create policy "gen_proposals_insert_own" on public.generated_proposals
  for insert with check (auth.uid() = user_id);

-- No la usa el flujo de v1 (que hace upsert ignore-duplicates), pero
-- la agregamos ahora para no necesitar otra migracion el dia que se
-- agregue "regenerar propuesta".
drop policy if exists "gen_proposals_update_own" on public.generated_proposals;
create policy "gen_proposals_update_own" on public.generated_proposals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
