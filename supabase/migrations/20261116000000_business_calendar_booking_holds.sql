-- Febily: transactional per-business booking holds.
-- Holds serialize Febily booking requests and prevent overlapping appointments.

create extension if not exists btree_gist;

create table if not exists public.business_calendar_booking_holds (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  idempotency_key text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (status in ('creating', 'confirmed')),
  lease_expires_at timestamptz,
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_calendar_booking_holds_valid_range check (ends_at > starts_at),
  constraint business_calendar_booking_holds_confirmed_has_event
    check (status <> 'confirmed' or google_event_id is not null)
);

create unique index if not exists business_calendar_booking_holds_idempotency_idx
  on public.business_calendar_booking_holds (business_id, idempotency_key);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'business_calendar_booking_holds_no_overlap'
      and conrelid = 'public.business_calendar_booking_holds'::regclass
  ) then
    alter table public.business_calendar_booking_holds
      add constraint business_calendar_booking_holds_no_overlap
      exclude using gist (
        business_id with =,
        tstzrange(starts_at, ends_at, '[)') with &&
      )
      where (status in ('creating', 'confirmed'));
  end if;
end;
$$;

create index if not exists business_calendar_booking_holds_lease_idx
  on public.business_calendar_booking_holds (lease_expires_at)
  where status = 'creating';

alter table public.business_calendar_booking_holds enable row level security;
revoke all on table public.business_calendar_booking_holds from public, anon, authenticated;
grant select, insert, update, delete on table public.business_calendar_booking_holds to service_role;

create or replace function public.reserve_business_calendar_booking(
  p_business_id uuid,
  p_owner_id uuid,
  p_idempotency_key text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_lease_seconds integer default 180
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_subscription_count integer;
  v_existing public.business_calendar_booking_holds%rowtype;
  v_booking_id uuid;
begin
  if p_business_id is null
    or p_owner_id is null
    or p_idempotency_key is null
    or length(p_idempotency_key) < 16
    or length(p_idempotency_key) > 128
    or p_starts_at is null
    or p_ends_at is null
    or p_ends_at <= p_starts_at
    or p_starts_at <= now()
    or p_starts_at > now() + interval '120 days'
  then
    return jsonb_build_object('state', 'invalid_request');
  end if;

  if not exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = p_owner_id
  ) then
    return jsonb_build_object('state', 'business_not_owned');
  end if;

  select count(*) into v_subscription_count
  from public.subscriptions s
  where s.user_id = p_owner_id
    and s.business_id = p_business_id
    and s.status = 'active'
    and s.paddle_subscription_id is not null
    and s.current_period_end > now();

  if v_subscription_count <> 1 then
    return jsonb_build_object('state', 'subscription_not_eligible');
  end if;

  delete from public.business_calendar_booking_holds
  where status = 'creating'
    and lease_expires_at <= now();

  select * into v_existing
  from public.business_calendar_booking_holds
  where business_id = p_business_id
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.status = 'confirmed' then
      return jsonb_build_object('state', 'already_booked', 'bookingId', v_existing.id);
    end if;
    if v_existing.lease_expires_at > now() then
      return jsonb_build_object('state', 'in_progress', 'bookingId', v_existing.id);
    end if;
    delete from public.business_calendar_booking_holds
    where id = v_existing.id and status = 'creating';
  end if;

  begin
    insert into public.business_calendar_booking_holds (
      business_id, idempotency_key, starts_at, ends_at, status, lease_expires_at
    ) values (
      p_business_id,
      p_idempotency_key,
      p_starts_at,
      p_ends_at,
      'creating',
      now() + make_interval(secs => greatest(30, least(coalesce(p_lease_seconds, 180), 300)))
    )
    returning id into v_booking_id;
  exception
    when exclusion_violation then
      return jsonb_build_object('state', 'time_conflict');
    when unique_violation then
      select * into v_existing
      from public.business_calendar_booking_holds
      where business_id = p_business_id and idempotency_key = p_idempotency_key;
      if found and v_existing.status = 'confirmed' then
        return jsonb_build_object('state', 'already_booked', 'bookingId', v_existing.id);
      end if;
      return jsonb_build_object('state', 'in_progress');
  end;

  return jsonb_build_object('state', 'claimed', 'bookingId', v_booking_id);
end;
$$;

create or replace function public.complete_business_calendar_booking(
  p_business_id uuid,
  p_owner_id uuid,
  p_booking_id uuid,
  p_google_event_id text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_updated integer;
begin
  if p_google_event_id is null or length(p_google_event_id) < 1 then
    return false;
  end if;
  if not exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = p_owner_id
  ) then
    return false;
  end if;

  update public.business_calendar_booking_holds
  set status = 'confirmed',
      google_event_id = p_google_event_id,
      lease_expires_at = null,
      updated_at = now()
  where id = p_booking_id
    and business_id = p_business_id
    and status = 'creating'
    and lease_expires_at > now();

  get diagnostics v_updated = row_count;
  if v_updated = 1 then return true; end if;

  return exists (
    select 1 from public.business_calendar_booking_holds h
    where h.id = p_booking_id
      and h.business_id = p_business_id
      and h.status = 'confirmed'
      and h.google_event_id = p_google_event_id
  );
end;
$$;

create or replace function public.release_business_calendar_booking(
  p_business_id uuid,
  p_booking_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_deleted integer;
begin
  delete from public.business_calendar_booking_holds
  where id = p_booking_id
    and business_id = p_business_id
    and status = 'creating';
  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end;
$$;

revoke all on function public.reserve_business_calendar_booking(uuid, uuid, text, timestamptz, timestamptz, integer) from public, anon, authenticated;
revoke all on function public.complete_business_calendar_booking(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.release_business_calendar_booking(uuid, uuid) from public, anon, authenticated;

grant execute on function public.reserve_business_calendar_booking(uuid, uuid, text, timestamptz, timestamptz, integer) to service_role;
grant execute on function public.complete_business_calendar_booking(uuid, uuid, uuid, text) to service_role;
grant execute on function public.release_business_calendar_booking(uuid, uuid) to service_role;

comment on table public.business_calendar_booking_holds is
  'Server-only idempotency and exclusion locks for Febily Google Calendar bookings.';
