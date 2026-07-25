-- ============================================================
--  ROW LEVEL SECURITY
--  El worker usa la SERVICE ROLE KEY, que bypassea RLS.
--  Estas politicas protegen a los usuarios del frontend Next.js
--  (que usa la ANON KEY con JWT del usuario).
-- ============================================================

alter table public.profiles              enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.user_platforms        enable row level security;
alter table public.telegram_links        enable row level security;
alter table public.telegram_link_tokens  enable row level security;
alter table public.notifications_sent    enable row level security;
alter table public.usage_log             enable row level security;

-- plans y sectors son publicos (catalogos)
alter table public.plans   enable row level security;
alter table public.sectors enable row level security;

-- scraped_jobs: solo lo lee el worker (service role), nunca el frontend directo
alter table public.scraped_jobs enable row level security;

-- --------------------------------------------------------
-- PROFILES: cada usuario ve/edita solo el suyo
-- --------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- --------------------------------------------------------
-- SUBSCRIPTIONS: solo lectura de la propia
-- --------------------------------------------------------
drop policy if exists "subs_select_own" on public.subscriptions;
create policy "subs_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- --------------------------------------------------------
-- USER_PLATFORMS: CRUD sobre las propias
-- --------------------------------------------------------
drop policy if exists "up_select_own" on public.user_platforms;
create policy "up_select_own" on public.user_platforms
  for select using (auth.uid() = user_id);

drop policy if exists "up_insert_own" on public.user_platforms;
create policy "up_insert_own" on public.user_platforms
  for insert with check (auth.uid() = user_id);

drop policy if exists "up_update_own" on public.user_platforms;
create policy "up_update_own" on public.user_platforms
  for update using (auth.uid() = user_id);

drop policy if exists "up_delete_own" on public.user_platforms;
create policy "up_delete_own" on public.user_platforms
  for delete using (auth.uid() = user_id);

-- --------------------------------------------------------
-- TELEGRAM_LINKS: solo lectura y borrado del propio
-- (la insercion la hace el bot con service role)
-- --------------------------------------------------------
drop policy if exists "tl_select_own" on public.telegram_links;
create policy "tl_select_own" on public.telegram_links
  for select using (auth.uid() = user_id);

drop policy if exists "tl_delete_own" on public.telegram_links;
create policy "tl_delete_own" on public.telegram_links
  for delete using (auth.uid() = user_id);

-- --------------------------------------------------------
-- TELEGRAM_LINK_TOKENS: el usuario puede crear su token
-- --------------------------------------------------------
drop policy if exists "tlt_insert_own" on public.telegram_link_tokens;
create policy "tlt_insert_own" on public.telegram_link_tokens
  for insert with check (auth.uid() = user_id);

drop policy if exists "tlt_select_own" on public.telegram_link_tokens;
create policy "tlt_select_own" on public.telegram_link_tokens
  for select using (auth.uid() = user_id);

-- --------------------------------------------------------
-- NOTIFICATIONS_SENT y USAGE_LOG: solo lectura propia
-- --------------------------------------------------------
drop policy if exists "notif_select_own" on public.notifications_sent;
create policy "notif_select_own" on public.notifications_sent
  for select using (auth.uid() = user_id);

drop policy if exists "usage_select_own" on public.usage_log;
create policy "usage_select_own" on public.usage_log
  for select using (auth.uid() = user_id);

-- --------------------------------------------------------
-- CATALOGOS PUBLICOS: cualquiera autenticado los lee
-- --------------------------------------------------------
drop policy if exists "plans_read" on public.plans;
create policy "plans_read" on public.plans
  for select using (true);

drop policy if exists "sectors_read" on public.sectors;
create policy "sectors_read" on public.sectors
  for select using (is_active = true);

-- --------------------------------------------------------
-- SCRAPED_JOBS: bloqueado al frontend (solo service role escribe/lee)
-- (no creamos policies, RLS activo bloquea todo por defecto)
-- --------------------------------------------------------
