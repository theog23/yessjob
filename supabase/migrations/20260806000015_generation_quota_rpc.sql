-- ============================================================
--  RPCs de cuota de generaciones IA: consumir (atomico, para el
--  worker) y consultar saldo (de solo lectura, self-service desde
--  el dashboard).
-- ============================================================

create or replace function public.try_consume_generation(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_start timestamptz;
  v_limit        int;
  v_used         int;
  v_batch_id     uuid;
begin
  -- Bloquea la fila de suscripcion de este usuario para serializar
  -- llamadas concurrentes (doble tap del boton, ciclos solapados del
  -- worker). Sin este lock, dos llamadas simultaneas podrian contar
  -- "99 < 100" cada una y dejar pasar 101 generaciones.
  select s.current_period_start, pl.max_generations_per_month
    into v_period_start, v_limit
  from public.subscriptions s
  join public.plans pl on pl.id = s.plan_id
  where s.user_id = p_user_id
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now())
  for update of s;

  if not found then
    return false;   -- sin suscripcion activa (prueba vencida, etc.)
  end if;

  select count(*) into v_used
  from public.usage_log
  where user_id = p_user_id
    and action = 'proposal_generated'
    and created_at >= v_period_start;

  if v_used < v_limit then
    insert into public.usage_log (user_id, action, metadata)
    values (p_user_id, 'proposal_generated', jsonb_build_object('source', 'base_quota'));
    return true;
  end if;

  -- Cuota base agotada: descuenta del lote comprado que vence antes
  -- (purchased_at asc = expires_at asc, ya que expires_at = purchased_at
  -- + 3 meses). SKIP LOCKED es defensivo (no hace falta para este
  -- mismo usuario, ya serializado arriba por el lock de subscriptions).
  select id into v_batch_id
  from public.generation_purchases
  where user_id = p_user_id
    and remaining > 0
    and expires_at > now()
  order by purchased_at asc
  limit 1
  for update skip locked;

  if v_batch_id is null then
    return false;   -- sin cuota base ni comprada disponible
  end if;

  update public.generation_purchases
  set remaining = remaining - 1, updated_at = now()
  where id = v_batch_id;

  insert into public.usage_log (user_id, action, metadata)
  values (p_user_id, 'proposal_generated', jsonb_build_object('source', 'purchased', 'batch_id', v_batch_id));

  return true;
end;
$$;

revoke execute on function public.try_consume_generation(uuid) from public, anon, authenticated;
grant  execute on function public.try_consume_generation(uuid) to service_role;


-- Solo lectura. SECURITY INVOKER (NO definer) a proposito: al
-- respetar RLS del caller, es seguro otorgarla a 'authenticated' --
-- un usuario que pase el uuid de otro solo obtiene 0 filas, nunca
-- datos ajenos. service_role la usa igual (bypassea RLS) para
-- /status del bot con cualquier user_id.
create or replace function public.get_generation_balance(p_user_id uuid)
returns table (
  base_limit            int,
  base_used             int,
  base_remaining        int,
  purchased_remaining   int,
  next_purchase_expiry  timestamptz,
  period_start          timestamptz,
  trial_expires_at      timestamptz,
  is_active             boolean
)
language sql
security invoker
set search_path = public
as $$
  with sub as (
    select s.current_period_start, s.expires_at, s.status, pl.max_generations_per_month
    from public.subscriptions s
    join public.plans pl on pl.id = s.plan_id
    where s.user_id = p_user_id
  ),
  used as (
    select count(*) as n
    from public.usage_log ul, sub
    where ul.user_id = p_user_id
      and ul.action = 'proposal_generated'
      and ul.created_at >= sub.current_period_start
  ),
  purchased as (
    select coalesce(sum(remaining), 0) as n, min(expires_at) as next_expiry
    from public.generation_purchases
    where user_id = p_user_id and remaining > 0 and expires_at > now()
  )
  select
    sub.max_generations_per_month,
    used.n::int,
    greatest(sub.max_generations_per_month - used.n, 0)::int,
    purchased.n::int,
    purchased.next_expiry,
    sub.current_period_start,
    sub.expires_at,
    (sub.status = 'active' and (sub.expires_at is null or sub.expires_at > now()))
  from sub, used, purchased;
$$;

revoke execute on function public.get_generation_balance(uuid) from public, anon;
grant  execute on function public.get_generation_balance(uuid) to authenticated, service_role;


-- Stub reservado para el futuro paso de cobro: cuando exista un
-- webhook de pago exitoso, debe llamar a esta funcion para arrancar
-- un nuevo periodo de cuota. Sin esto, la cuota mensual de un
-- suscriptor pago (no en prueba) nunca se reiniciaria. No se llama
-- desde ningun lado todavia -- es intencional.
create or replace function public.renew_subscription_period(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.subscriptions
  set current_period_start = now(), updated_at = now()
  where user_id = p_user_id;
$$;

revoke execute on function public.renew_subscription_period(uuid) from public, anon, authenticated;
grant  execute on function public.renew_subscription_period(uuid) to service_role;
