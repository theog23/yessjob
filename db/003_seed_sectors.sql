-- ============================================================
--  SEED — Sectores con mapping Workana <-> Freelancer
--  Las categorias de Workana provienen de sus URLs publicas.
--  Los skill_ids de Freelancer son un subconjunto representativo;
--  se pueden ampliar con la API de Freelancer /jobs.
-- ============================================================

insert into public.sectors (slug, name, workana_category, freelancer_skill_ids, sort_order) values

  ('it-programming',
   'IT y Programacion',
   'it-programming',
   '{7,9,17,32,69,116,127,138,247,278,305,323,335,564,669,687,759,763,913,1031,1073,1092,1240,1314,1525,1623,1699,1977,2126,2367,2585,2701,2825,3004,3112}'::int[],
   1),

  ('design-multimedia',
   'Diseno y Multimedia',
   'design-multimedia',
   '{3,20,32,79,161,246,270,320,332,354,401,776,1050}'::int[],
   2),

  ('writing-translation',
   'Redaccion y Traduccion',
   'writing-translation',
   '{22,39,205,209,271,412,441,619,662,1093}'::int[],
   3),

  ('marketing-sales',
   'Marketing y Ventas',
   'sales-marketing',
   '{36,51,140,202,275,342,391,632,1132,1229}'::int[],
   4),

  ('admin-support',
   'Soporte Administrativo',
   'admin-support',
   '{131,149,238,332,404,613,1078}'::int[],
   5),

  ('finance-management',
   'Finanzas y Gestion',
   'finance-management',
   '{38,79,164,207,213,258,417}'::int[],
   6),

  ('legal',
   'Legal',
   'legal',
   '{47,155,304,414}'::int[],
   7),

  ('engineering-manufacturing',
   'Ingenieria',
   'engineering-manufacturing',
   '{23,45,196,282,300,364,506}'::int[],
   8)

on conflict (slug) do update set
  name                  = excluded.name,
  workana_category      = excluded.workana_category,
  freelancer_skill_ids  = excluded.freelancer_skill_ids,
  sort_order            = excluded.sort_order;
