-- Persist caller-confirmed contact details alongside the server-only booking hold.
-- Customer contact is written before the Google Calendar event is created. The
-- existing RLS/service-role boundary remains in place.

alter table public.business_calendar_booking_holds
  add column if not exists customer_name text,
  add column if not exists customer_phone_e164 text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'business_calendar_booking_holds_customer_name_valid'
      and conrelid = 'public.business_calendar_booking_holds'::regclass
  ) then
    alter table public.business_calendar_booking_holds
      add constraint business_calendar_booking_holds_customer_name_valid
      check (
        customer_name is null
        or length(btrim(customer_name)) between 1 and 100
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'business_calendar_booking_holds_customer_phone_valid'
      and conrelid = 'public.business_calendar_booking_holds'::regclass
  ) then
    alter table public.business_calendar_booking_holds
      add constraint business_calendar_booking_holds_customer_phone_valid
      check (
        customer_phone_e164 is null
        or customer_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
      );
  end if;
end;
$$;

create or replace function public.set_business_calendar_booking_contact(
  p_business_id uuid,
  p_booking_id uuid,
  p_customer_name text,
  p_customer_phone_e164 text
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
  then
    return false;
  end if;

  update public.business_calendar_booking_holds
  set customer_name = btrim(p_customer_name),
      customer_phone_e164 = p_customer_phone_e164,
      updated_at = now()
  where id = p_booking_id
    and business_id = p_business_id
    and status = 'creating'
    and lease_expires_at > now();

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.set_business_calendar_booking_contact(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.set_business_calendar_booking_contact(uuid, uuid, text, text)
  to service_role;

comment on column public.business_calendar_booking_holds.customer_name is
  'Caller-confirmed customer name for the salon appointment; accessible to service_role only.';
comment on column public.business_calendar_booking_holds.customer_phone_e164 is
  'Caller-confirmed customer callback number in E.164 format; accessible to service_role only.';
