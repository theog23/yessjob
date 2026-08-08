-- El estilo de propuesta pasa de ser un unico campo global
-- (profiles.proposal_style) a uno por tipo de plataforma, ya que un
-- usuario puede querer sonar distinto en Workana que en Upwork. Se
-- verifico en produccion que profiles.proposal_style no tiene ningun
-- valor no-nulo actualmente, asi que no hace falta backfill.

create table public.user_proposal_styles (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  platform    text not null check (platform in ('workana','freelancer','upwork')),
  style       text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, platform)
);

alter table public.user_proposal_styles enable row level security;

create policy "ups_select_own" on public.user_proposal_styles
  for select using (auth.uid() = user_id);

create policy "ups_insert_own" on public.user_proposal_styles
  for insert with check (auth.uid() = user_id);

create policy "ups_update_own" on public.user_proposal_styles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.profiles drop column proposal_style;
