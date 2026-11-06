-- Febily: store a Vapi assistant per business.
-- A shared template assistant must never be used directly for every subscribed business.

alter table public.businesses
  add column if not exists vapi_assistant_id text,
  add column if not exists vapi_provisioning_status text not null default 'pending',
  add column if not exists vapi_provisioned_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_vapi_provisioning_status_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_vapi_provisioning_status_check
      check (vapi_provisioning_status in ('pending', 'provisioned', 'failed'));
  end if;
end
$$;

create unique index if not exists businesses_vapi_assistant_id_unique
  on public.businesses (vapi_assistant_id)
  where vapi_assistant_id is not null;

comment on column public.businesses.vapi_assistant_id is
  'Business-specific Vapi assistant ID. Do not store a shared template assistant ID here.';
comment on column public.businesses.vapi_provisioning_status is
  'Vapi assistant provisioning state; token issuance is allowed only when provisioned.';
