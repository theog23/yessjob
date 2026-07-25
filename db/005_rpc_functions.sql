-- ============================================================
--  FUNCIONES RPC utilizadas por el worker
-- ============================================================

-- Devuelve una fila por cada (usuario x plataforma x sector) que
-- el worker debe procesar en este ciclo: usuarios activos con
-- Telegram vinculado, sus filtros y los datos del sector.
create or replace function public.get_active_scrape_targets()
returns table (
  user_id                uuid,
  chat_id                bigint,
  plan_slug              text,
  min_scrape_interval    int,
  platform               text,
  sector_slug            text,
  workana_category       text,
  freelancer_skill_ids   int[],
  keywords               text[],
  excluded_keywords      text[],
  min_budget_usd         numeric
)
language sql
security definer
set search_path = public
as $$
  select
    va.user_id,
    va.telegram_chat_id                as chat_id,
    va.plan_slug,
    va.min_scrape_interval_min         as min_scrape_interval,
    up.platform,
    s.slug                              as sector_slug,
    s.workana_category,
    s.freelancer_skill_ids,
    up.keywords,
    up.excluded_keywords,
    up.min_budget_usd
  from v_active_users va
  join user_platforms up on up.user_id = va.user_id and up.is_active = true
  join sectors s         on s.id = up.sector_id and s.is_active = true
  where va.telegram_chat_id is not null;
$$;
