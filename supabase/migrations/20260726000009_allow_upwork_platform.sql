-- ============================================================
--  Permite 'upwork' como plataforma valida en user_platforms y
--  scraped_jobs. Upwork no tiene categorias/skills server-side como
--  Workana/Freelancer (su busqueda publica no las soporta), asi que
--  no hace falta ninguna columna nueva en sectors: el "sector" que
--  elija el usuario para un filtro de Upwork es solo organizativo,
--  el matching real lo hacen las keywords contra el feed general de
--  "mas recientes".
-- ============================================================

alter table public.user_platforms drop constraint if exists user_platforms_platform_check;
alter table public.user_platforms add constraint user_platforms_platform_check
  check (platform in ('workana', 'freelancer', 'upwork'));

alter table public.scraped_jobs drop constraint if exists scraped_jobs_platform_check;
alter table public.scraped_jobs add constraint scraped_jobs_platform_check
  check (platform in ('workana', 'freelancer', 'upwork'));
