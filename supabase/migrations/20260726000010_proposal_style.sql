-- ============================================================
--  Permite que cada usuario defina su propio estilo/estructura de
--  propuesta. Si es null, el generador usa la plantilla por defecto
--  (la que ya existia, pensada originalmente para un solo usuario).
--  No hace falta tocar RLS: profiles ya tiene "profiles_update_own"
--  que permite a cada usuario actualizar su propia fila.
-- ============================================================

alter table public.profiles add column if not exists proposal_style text;

comment on column public.profiles.proposal_style is
  'Instrucciones o ejemplo propio del usuario sobre como generar sus propuestas con IA. Si es null, se usa la plantilla por defecto.';
