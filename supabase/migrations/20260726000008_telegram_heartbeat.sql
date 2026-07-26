-- ============================================================
--  HEARTBEAT — permite avisar "sin novedades" cuando pasa 1 hora
--  sin ninguna notificacion real, para que el usuario sepa que el
--  sistema sigue vivo sin tener que revisar logs.
-- ============================================================

alter table public.telegram_links
  add column if not exists last_activity_at timestamptz not null default now();

comment on column public.telegram_links.last_activity_at is
  'Ultima vez que se le envio algo a este chat (notificacion real o heartbeat). El worker la usa para saber cuando mandar el aviso de "sin novedades".';
