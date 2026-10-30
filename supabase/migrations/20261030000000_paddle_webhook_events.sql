-- Febily: durable Paddle webhook processing and out-of-order event protection.
-- Apply this migration to the Supabase project before deploying the webhook code.

alter table public.subscriptions
  add column if not exists paddle_subscription_event_occurred_at timestamptz;

create table if not exists public.paddle_webhook_events (
  event_id text primary key,
  event_type text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  processing_status text not null default 'processing'
    check (processing_status in ('processing', 'processed', 'failed')),
  processed_at timestamptz,
  last_error text
);

create index if not exists paddle_webhook_events_status_received_idx
  on public.paddle_webhook_events (processing_status, received_at);

alter table public.paddle_webhook_events enable row level security;

-- Webhook processing uses the server-side Supabase secret key. No browser role
-- should be able to inspect or mutate Paddle delivery records.
revoke all on table public.paddle_webhook_events from anon, authenticated;
grant all on table public.paddle_webhook_events to service_role;
