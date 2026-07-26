-- ============================================================
--  HARDENING — cierra accesos que el linter de seguridad detecto:
--  1) get_active_scrape_targets() y handle_new_user() son
--     SECURITY DEFINER y quedaban invocables via REST por
--     anon/authenticated. Solo el worker (service_role) debe
--     poder leer targets; el trigger no necesita exponerse.
--  2) v_active_users corria con permisos del creador (bypass RLS).
--     La pasamos a security_invoker para que respete RLS si
--     alguna vez se consulta con un JWT de usuario.
-- ============================================================

revoke execute on function public.get_active_scrape_targets() from public, anon, authenticated;
grant  execute on function public.get_active_scrape_targets() to service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter view public.v_active_users set (security_invoker = true);
revoke select on public.v_active_users from public, anon, authenticated;
grant  select on public.v_active_users to service_role;
