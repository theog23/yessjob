-- ============================================================
--  PLAN UNICO — Pro, USD 10/mes, reemplaza free/premium.
-- ============================================================

-- No se borran free/premium (evita romper la FK de subscriptions
-- que aun apunten a ellos hasta el UPDATE de abajo), solo se
-- desactivan para que dejen de listarse en el frontend.
update public.plans set is_active = false where slug in ('free', 'premium');

insert into public.plans
  (slug, name, price_usd, max_platforms, max_sectors, max_keywords, min_scrape_interval_min, max_generations_per_month, is_active)
values
  ('pro', 'Pro', 10, 3, 3, 20, 1, 100, true)
on conflict (slug) do update set
  name                       = excluded.name,
  price_usd                  = excluded.price_usd,
  max_platforms               = excluded.max_platforms,
  max_sectors                 = excluded.max_sectors,
  max_keywords                 = excluded.max_keywords,
  min_scrape_interval_min     = excluded.min_scrape_interval_min,
  max_generations_per_month   = excluded.max_generations_per_month,
  is_active                   = true;

-- Migra a TODOS los usuarios existentes (sin importar que plan
-- tenian) al plan Pro unico. No se toca status/starts_at/expires_at:
-- un usuario que ya estaba activo sigue activo con la misma fecha de
-- expiracion (o sin ella) -- no se le impone una prueba de 15 dias
-- retroactiva a nadie que ya existia antes de este cambio.
with pro as (select id from public.plans where slug = 'pro')
update public.subscriptions s
set plan_id = pro.id,
    updated_at = now()
from pro
where s.plan_id <> pro.id;
