-- ============================================================
--  CUOTA DE GENERACIONES IA — de "propuestas por dia" a "cupo
--  mensual + compras extra". Este archivo solo cambia la FORMA del
--  esquema; los datos del plan Pro y el trigger de alta se
--  actualizan en los siguientes archivos.
-- ============================================================

-- 1) La cuota deja de ser "por dia" y pasa a ser "por mes" (no
--    acumulable, se resetea cada periodo). Se renombra en vez de
--    crear una columna nueva para no dejar la vieja huerfana.
alter table public.plans
  rename column max_proposals_per_day to max_generations_per_month;

-- 2) Marca desde cuando arranca el periodo de cuota vigente de cada
--    suscripcion. Default now(): las filas existentes arrancan su
--    primer periodo "hoy" (nadie hereda cupo ya usado antes de esto).
alter table public.subscriptions
  add column if not exists current_period_start timestamptz not null default now();

-- 3) v_active_users expone una columna que ya no existe con ese
--    nombre. CREATE OR REPLACE VIEW no permite renombrar/quitar
--    columnas de salida (solo agregar al final), asi que hace falta
--    DROP + CREATE. Esto borra security_invoker y los grants de las
--    migraciones 006/007 -- se reponen abajo, en el mismo archivo.
drop view if exists public.v_active_users;

create view public.v_active_users as
select
  p.id                     as user_id,
  p.email,
  pl.slug                  as plan_slug,
  pl.max_platforms,
  pl.max_sectors,
  pl.max_keywords,
  pl.min_scrape_interval_min,
  pl.max_generations_per_month,
  s.status                 as subscription_status,
  s.expires_at             as subscription_expires_at,
  s.current_period_start   as subscription_period_start,
  tl.chat_id                as telegram_chat_id
from public.profiles p
join public.subscriptions s  on s.user_id = p.id
join public.plans pl         on pl.id = s.plan_id
left join public.telegram_links tl on tl.user_id = p.id
where s.status = 'active'
  and (s.expires_at is null or s.expires_at > now());

alter view public.v_active_users set (security_invoker = true);
revoke select on public.v_active_users from public, anon, authenticated;
grant  select on public.v_active_users to service_role;
grant  select on public.v_active_users to authenticated;
