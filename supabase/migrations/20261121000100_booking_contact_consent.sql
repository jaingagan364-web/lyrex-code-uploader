-- Require explicit caller permission before saving callback details with a booking.
-- The contact ledger remains service-role-only; consent is timestamped server-side.

alter table public.business_calendar_booking_holds
  add column if not exists customer_contact_consent_at timestamptz;

-- Remove the prior signature so no caller can use the old RPC without consent.
drop function if exists public.set_business_calendar_booking_contact(uuid, uuid, text, text);

create or replace function public.set_business_calendar_booking_contact(
  p_business_id uuid,
  p_booking_id uuid,
  p_customer_name text,
  p_customer_phone_e164 text,
  p_customer_contact_consent boolean
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_updated integer;
begin
  if p_business_id is null
    or p_booking_id is null
    or p_customer_name is null
    or length(btrim(p_customer_name)) < 1
    or length(btrim(p_customer_name)) > 100
    or p_customer_phone_e164 is null
    or p_customer_phone_e164 !~ '^\+[1-9][0-9]{7,14}$'
    or p_customer_contact_consent is distinct from true
  then
    return false;
  end if;

  update public.business_calendar_booking_holds
  set customer_name = btrim(p_customer_name),
      customer_phone_e164 = p_customer_phone_e164,
      customer_contact_consent_at = now(),
      updated_at = now()
  where id = p_booking_id
    and business_id = p_business_id
    and status = 'creating'
    and lease_expires_at > now();

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.set_business_calendar_booking_contact(uuid, uuid, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.set_business_calendar_booking_contact(uuid, uuid, text, text, boolean)
  to service_role;

comment on column public.business_calendar_booking_holds.customer_contact_consent_at is
  'Timestamp when the caller explicitly consented to saving the callback number for appointment-related contact; accessible to service_role only.';
