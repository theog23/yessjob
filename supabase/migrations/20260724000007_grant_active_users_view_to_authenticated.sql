-- v_active_users tiene security_invoker=true (migracion 006), por lo que
-- consultarla como usuario autenticado respeta el RLS de profiles,
-- subscriptions y telegram_links (todas scoped a auth.uid()). Es seguro
-- exponerla al frontend: cada usuario solo ve su propia fila. Sin este
-- grant, el dashboard no puede leer el plan/estado de telegram del propio
-- usuario.
grant select on public.v_active_users to authenticated;
