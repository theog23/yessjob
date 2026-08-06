-- ============================================================
--  GENERATION_PURCHASES — compras de +100 generaciones ($2 c/u).
--  Cada compra vence 3 meses despues de haberla hecho. Todavia no
--  hay checkout real: esta tabla solo prepara el modelo de datos,
--  la escritura queda reservada a service_role (un futuro flujo de
--  pago), no a 'authenticated'.
-- ============================================================

create table if not exists public.generation_purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  quantity      int not null default 100,
  remaining     int not null default 100 check (remaining >= 0 and remaining <= quantity),
  purchased_at  timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '3 months'),
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- El predicado de un indice parcial debe ser inmutable: no se puede
-- usar "expires_at > now()" aca. remaining>0 alcanza para descartar
-- lotes agotados; el filtro de vencimiento queda en runtime.
create index if not exists idx_generation_purchases_active
  on public.generation_purchases (user_id, purchased_at)
  where remaining > 0;

alter table public.generation_purchases enable row level security;

drop policy if exists "gen_purchases_select_own" on public.generation_purchases;
create policy "gen_purchases_select_own" on public.generation_purchases
  for select using (auth.uid() = user_id);

-- Sin flujo de cobro real todavia: solo service_role (una futura
-- funcion de checkout) inserta/actualiza. A proposito no hay
-- policies de insert/update/delete para 'authenticated'.
