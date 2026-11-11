-- Febily: safely provision one Vapi assistant per subscribed business.
-- A short-lived database lease prevents duplicate assistant creation when users
-- double-click or when multiple browser requests arrive concurrently.

alter table public.businesses
  add column if not exists vapi_provisioning_started_at timestamptz,
  add column if not exists vapi_provisioning_error text;

alter table public.businesses
  drop constraint if exists businesses_vapi_provisioning_status_check;

alter table public.businesses
  add constraint businesses_vapi_provisioning_status_check
  check (vapi_provisioning_status in ('pending', 'provisioning', 'provisioned', 'failed'));

create or replace function public.claim_vapi_assistant_provisioning(
  p_business_id uuid,
  p_owner_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_business public.businesses%rowtype;
begin
  if p_business_id is null or p_owner_id is null then
    return jsonb_build_object('state', 'invalid');
  end if;

  select *
    into v_business
    from public.businesses
    where id = p_business_id
      and owner_id = p_owner_id
    for update;

  if not found then
    return jsonb_build_object('state', 'not_found');
  end if;

  if v_business.vapi_provisioning_status = 'provisioned'
     and v_business.vapi_assistant_id is not null
     and length(trim(v_business.vapi_assistant_id)) > 0 then
    return jsonb_build_object('state', 'already_provisioned');
  end if;

  if v_business.vapi_provisioning_status = 'provisioning'
     and v_business.vapi_provisioning_started_at is not null
     and v_business.vapi_provisioning_started_at > now() - interval '15 minutes' then
    return jsonb_build_object('state', 'in_progress');
  end if;

  update public.businesses
    set vapi_provisioning_status = 'provisioning',
        vapi_provisioning_started_at = now(),
        vapi_provisioning_error = null,
        updated_at = now()
    where id = p_business_id
      and owner_id = p_owner_id;

  return jsonb_build_object('state', 'claimed');
end;
$$;

create or replace function public.complete_vapi_assistant_provisioning(
  p_business_id uuid,
  p_owner_id uuid,
  p_assistant_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated_id uuid;
begin
  if p_business_id is null
     or p_owner_id is null
     or p_assistant_id is null
     or length(trim(p_assistant_id)) = 0 then
    return jsonb_build_object('accepted', false, 'reason', 'invalid_input');
  end if;

  update public.businesses
    set vapi_assistant_id = p_assistant_id,
        vapi_provisioning_status = 'provisioned',
        vapi_provisioned_at = now(),
        vapi_provisioning_started_at = null,
        vapi_provisioning_error = null,
        updated_at = now()
    where id = p_business_id
      and owner_id = p_owner_id
      and vapi_provisioning_status = 'provisioning'
      and (vapi_assistant_id is null or vapi_assistant_id = p_assistant_id)
  returning id into v_updated_id;

  if v_updated_id is null then
    return jsonb_build_object('accepted', false, 'reason', 'state_changed');
  end if;

  return jsonb_build_object('accepted', true);
end;
$$;

revoke all on function public.claim_vapi_assistant_provisioning(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_vapi_assistant_provisioning(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_vapi_assistant_provisioning(uuid, uuid) to service_role;
grant execute on function public.complete_vapi_assistant_provisioning(uuid, uuid, text) to service_role;

comment on column public.businesses.vapi_provisioning_started_at is
  'Start time for the current Vapi provisioning lease; stale leases may be retried after 15 minutes.';
comment on column public.businesses.vapi_provisioning_error is
  'Sanitized operational error from the most recent Vapi provisioning attempt; never store secrets.';
