-- ============================================================
--  SCHEMA PRINCIPAL — Scraper Multi-Usuario (Workana + Freelancer)
--  Ejecuta este archivo desde el SQL Editor de Supabase.
--  Requiere que la extension pgcrypto y uuid-ossp esten activas
--  (Supabase las tiene por defecto).
-- ============================================================

-- --------------------------------------------------------
-- 1. PROFILES  (extiende auth.users de Supabase)
-- --------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  full_name     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Se crea automaticamente cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  -- Suscripcion inicial en plan 'free'
  insert into public.subscriptions (user_id, plan_id, status)
  values (new.id, (select id from public.plans where slug = 'free' limit 1), 'active');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------
-- 2. PLANS  (catalogo de planes)
-- --------------------------------------------------------
create table if not exists public.plans (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text unique not null,               -- 'free', 'pro', 'premium'
  name                      text not null,
  price_usd                 numeric(10,2) not null default 0,
  max_platforms             int not null default 1,             -- 1 o 2 (workana/freelancer)
  max_sectors               int not null default 1,
  max_keywords              int not null default 5,
  min_scrape_interval_min   int not null default 60,
  max_proposals_per_day     int not null default 3,
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now()
);

-- --------------------------------------------------------
-- 3. SUBSCRIPTIONS
-- --------------------------------------------------------
create table if not exists public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  plan_id       uuid not null references public.plans(id),
  status        text not null default 'active'
                check (status in ('active','paused','expired','canceled')),
  starts_at     timestamptz not null default now(),
  expires_at    timestamptz,                                    -- null = sin expiracion (free)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id)                                              -- 1 suscripcion activa por usuario
);

create index if not exists idx_subscriptions_status on public.subscriptions(status);

-- --------------------------------------------------------
-- 4. SECTORS  (catalogo con mapping a cada plataforma)
-- --------------------------------------------------------
create table if not exists public.sectors (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text unique not null,               -- 'it-programming', 'design', etc.
  name                      text not null,
  workana_category          text,                               -- ej: 'it-programming'
  freelancer_skill_ids      int[] default '{}',                 -- ej: '{7,9,17,...}'
  is_active                 boolean not null default true,
  sort_order                int not null default 0,
  created_at                timestamptz not null default now()
);

-- --------------------------------------------------------
-- 5. USER_PLATFORMS  (config de cada usuario x plataforma)
-- --------------------------------------------------------
create table if not exists public.user_platforms (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  platform          text not null check (platform in ('workana','freelancer')),
  sector_id         uuid not null references public.sectors(id),
  keywords          text[] not null default '{}',               -- palabras clave del usuario
  excluded_keywords text[] not null default '{}',
  min_budget_usd    numeric(10,2) not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, platform, sector_id)                         -- no repetir combos
);

create index if not exists idx_user_platforms_user on public.user_platforms(user_id);
create index if not exists idx_user_platforms_active on public.user_platforms(is_active) where is_active = true;

-- --------------------------------------------------------
-- 6. TELEGRAM_LINKS  (vinculacion user <-> chat_id)
-- --------------------------------------------------------
create table if not exists public.telegram_links (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  chat_id       bigint not null unique,
  username      text,                                           -- @handle si tiene
  linked_at     timestamptz not null default now()
);

-- --------------------------------------------------------
-- 7. TELEGRAM_LINK_TOKENS  (tokens de un solo uso para /start)
-- --------------------------------------------------------
create table if not exists public.telegram_link_tokens (
  token         text primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '15 minutes'),
  used_at       timestamptz
);

create index if not exists idx_tg_tokens_user on public.telegram_link_tokens(user_id);

-- --------------------------------------------------------
-- 8. SCRAPED_JOBS  (proyectos encontrados - deduped global)
-- --------------------------------------------------------
create table if not exists public.scraped_jobs (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null check (platform in ('workana','freelancer')),
  external_id   text not null,                                  -- id/slug de la plataforma
  title         text not null,
  description   text,
  url           text not null,
  budget_str    text,
  budget_usd    numeric(12,2),
  skills        text[] default '{}',
  language      text,
  posted_at     timestamptz,
  raw           jsonb,                                          -- payload completo por si acaso
  scraped_at    timestamptz not null default now(),
  unique (platform, external_id)
);

create index if not exists idx_jobs_platform_time on public.scraped_jobs(platform, scraped_at desc);

-- --------------------------------------------------------
-- 9. NOTIFICATIONS_SENT  (control anti-duplicado por usuario)
-- --------------------------------------------------------
create table if not exists public.notifications_sent (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  job_id        uuid not null references public.scraped_jobs(id) on delete cascade,
  sent_at       timestamptz not null default now(),
  unique (user_id, job_id)
);

create index if not exists idx_notif_user on public.notifications_sent(user_id, sent_at desc);

-- --------------------------------------------------------
-- 10. USAGE_LOG  (contador de propuestas IA para cuota)
-- --------------------------------------------------------
create table if not exists public.usage_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  action        text not null,                                  -- 'proposal_generated', 'notification_sent'
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists idx_usage_user_day
  on public.usage_log(user_id, action, created_at);

-- --------------------------------------------------------
-- Vista util: usuarios activos con su plan y limites
-- --------------------------------------------------------
create or replace view public.v_active_users as
select
  p.id            as user_id,
  p.email,
  pl.slug         as plan_slug,
  pl.max_platforms,
  pl.max_sectors,
  pl.max_keywords,
  pl.min_scrape_interval_min,
  pl.max_proposals_per_day,
  s.status        as subscription_status,
  s.expires_at    as subscription_expires_at,
  tl.chat_id      as telegram_chat_id
from public.profiles p
join public.subscriptions s  on s.user_id = p.id
join public.plans pl         on pl.id = s.plan_id
left join public.telegram_links tl on tl.user_id = p.id
where s.status = 'active'
  and (s.expires_at is null or s.expires_at > now());
