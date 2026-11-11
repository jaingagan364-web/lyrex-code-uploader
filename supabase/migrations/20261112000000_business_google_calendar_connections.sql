-- Febily: securely isolate Google Calendar connections per business.
-- Refresh tokens are encrypted by the application before storage. They are never
-- returned to browser clients. Only the Vercel server's service-role client can
-- read or mutate these tables.

create table if not exists public.business_calendar_connections (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  provider text not null default 'google' check (provider = 'google'),
  calendar_id text not null default 'primary',
  account_email text,
  refresh_token_encrypted text not null,
  granted_scopes text[] not null default '{}',
  connection_status text not null default 'connected'
    check (connection_status in ('connected', 'reconnect_required', 'revoked')),
  connected_at timestamptz not null default now(),
  last_verified_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_calendar_oauth_states (
  state_hash text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists business_calendar_oauth_states_expires_at_idx
  on public.business_calendar_oauth_states (expires_at);

alter table public.business_calendar_connections enable row level security;
alter table public.business_calendar_oauth_states enable row level security;

revoke all on table public.business_calendar_connections from public, anon, authenticated;
revoke all on table public.business_calendar_oauth_states from public, anon, authenticated;

grant select, insert, update, delete on table public.business_calendar_connections to service_role;
grant select, insert, update, delete on table public.business_calendar_oauth_states to service_role;

comment on table public.business_calendar_connections is
  'One encrypted Google Calendar refresh token per business. Never expose this table via client-side Supabase.';
comment on column public.business_calendar_connections.refresh_token_encrypted is
  'AES-256-GCM encrypted Google OAuth refresh token; decryption key exists only in server environment.';
comment on table public.business_calendar_oauth_states is
  'Single-use, expiring Google OAuth state challenges bound to a business and owner.';
