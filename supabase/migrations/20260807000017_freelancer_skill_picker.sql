-- Freelancer.com deja de filtrarse por "sector" (abstraccion de 8 rubros
-- creada a mano) y pasa a un selector real de skills, sourced del catalogo
-- publico de Freelancer.com (freelancer_skills, poblado en la migracion
-- siguiente). Workana sigue igual (sector obligatorio); Upwork nunca uso
-- el sector para nada, deja de pedirlo.

alter table public.user_platforms
  alter column sector_id drop not null;

alter table public.user_platforms
  add column freelancer_skill_ids integer[];

-- Defensivo: si alguna fila platform='freelancer' ya existiera (hoy no hay
-- ninguna en produccion), la migra a partir del array fijo de su sector
-- antes de que el check de abajo la exija no vacia.
update public.user_platforms up
set freelancer_skill_ids = s.freelancer_skill_ids
from public.sectors s
where up.platform = 'freelancer'
  and up.freelancer_skill_ids is null
  and s.id = up.sector_id;

alter table public.user_platforms
  add constraint user_platforms_workana_sector_ck
    check (platform <> 'workana' or sector_id is not null);

alter table public.user_platforms
  add constraint user_platforms_freelancer_skills_ck
    check (
      platform <> 'freelancer'
      or (freelancer_skill_ids is not null and array_length(freelancer_skill_ids, 1) > 0)
    );

create table public.freelancer_skills (
  id integer primary key,
  name text not null,
  category text
);

alter table public.freelancer_skills enable row level security;

create policy freelancer_skills_read on public.freelancer_skills
  for select using (true);

-- LEFT JOIN para no perder las filas de Freelancer/Upwork (sector_id ahora
-- puede ser null), pero preservando el "kill switch" que hoy tiene Workana:
-- si su sector se desactiva, sus filtros deben seguir sin aparecer aca. Un
-- LEFT JOIN sin el filtro extra rompería eso silenciosamente.
create or replace function public.get_active_scrape_targets()
returns table(
  user_id uuid,
  chat_id bigint,
  plan_slug text,
  min_scrape_interval integer,
  platform text,
  sector_slug text,
  workana_category text,
  freelancer_skill_ids integer[],
  keywords text[],
  excluded_keywords text[],
  min_budget_usd numeric
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    va.user_id,
    va.telegram_chat_id                as chat_id,
    va.plan_slug,
    va.min_scrape_interval_min         as min_scrape_interval,
    up.platform,
    s.slug                              as sector_slug,
    s.workana_category,
    up.freelancer_skill_ids,
    up.keywords,
    up.excluded_keywords,
    up.min_budget_usd
  from v_active_users va
  join user_platforms up on up.user_id = va.user_id and up.is_active = true
  left join sectors s     on s.id = up.sector_id and s.is_active = true
  where va.telegram_chat_id is not null
    and (up.platform <> 'workana' or s.id is not null);
$function$;
