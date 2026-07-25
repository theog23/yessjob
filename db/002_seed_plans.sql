-- ============================================================
--  SEED — Planes iniciales
-- ============================================================

insert into public.plans (slug, name, price_usd, max_platforms, max_sectors, max_keywords, min_scrape_interval_min, max_proposals_per_day)
values
  ('free',    'Free',     0,   1, 1,  5, 60,  3),
  ('pro',     'Pro',     19,   2, 3, 20, 15, 30),
  ('premium', 'Premium', 39,   2, 8, 50,  5, 999)
on conflict (slug) do update set
  name                     = excluded.name,
  price_usd                = excluded.price_usd,
  max_platforms            = excluded.max_platforms,
  max_sectors              = excluded.max_sectors,
  max_keywords             = excluded.max_keywords,
  min_scrape_interval_min  = excluded.min_scrape_interval_min,
  max_proposals_per_day    = excluded.max_proposals_per_day;
