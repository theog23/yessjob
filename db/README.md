# Base de datos (Supabase)

Ejecutar los archivos en orden desde el **SQL Editor** de Supabase:

1. `001_schema.sql` — crea tablas, trigger y vista.
2. `002_seed_plans.sql` — planes: `free`, `pro`, `premium`.
3. `003_seed_sectors.sql` — catalogo de sectores con mapping Workana/Freelancer.
4. `004_rls_policies.sql` — politicas RLS para el frontend.

## Variables que necesitas guardar de Supabase

Del panel **Project Settings > API**:

- `SUPABASE_URL` — `https://xxxx.supabase.co`
- `SUPABASE_ANON_KEY` — para el frontend Next.js
- `SUPABASE_SERVICE_ROLE_KEY` — para el worker Python (bypassea RLS)

## Notas

- El trigger `handle_new_user` crea el `profile` y le asigna plan `free` automaticamente al registrarse en Auth.
- Los `freelancer_skill_ids` en `sectors` son un subconjunto inicial. Se pueden ampliar consultando `https://www.freelancer.com/api/projects/0.1/jobs/` o desde el panel admin.
- `scraped_jobs` esta bloqueado al frontend por RLS; solo el worker (service role) lee/escribe alli. El frontend accede a los jobs de un usuario via `notifications_sent` join.
