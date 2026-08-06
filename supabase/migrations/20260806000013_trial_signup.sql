-- ============================================================
--  PRUEBA GRATUITA DE 15 DIAS — todo signup nuevo entra al plan
--  Pro con expires_at = ahora + 15 dias, sin pedir tarjeta.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pro_plan_id uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  select id into v_pro_plan_id from public.plans where slug = 'pro' limit 1;

  -- Prueba gratuita de 15 dias, sin tarjeta: expires_at marca el
  -- corte automatico (ver v_active_users). Convencion: expires_at
  -- NULL = pagando / sin corte programado; expires_at futuro = se
  -- cortara en esa fecha salvo que un futuro flujo de cobro extienda
  -- el acceso (llamando a renew_subscription_period() o actualizando
  -- expires_at directamente).
  insert into public.subscriptions (user_id, plan_id, status, expires_at, current_period_start)
  values (new.id, v_pro_plan_id, 'active', now() + interval '15 days', now());

  return new;
end;
$$;

-- CREATE OR REPLACE FUNCTION preserva los grants existentes, pero se
-- repite explicitamente por si alguna vez se recrea este archivo
-- fuera de orden.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
