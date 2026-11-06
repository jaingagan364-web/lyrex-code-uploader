-- Febily: require a verified checkout owner for new Paddle subscriptions.
-- This is a corrective migration because the earlier RPC could insert an
-- unowned subscription if Paddle custom_data did not contain a valid HMAC proof.

create or replace function public.apply_paddle_subscription_event(
  p_paddle_subscription_id text,
  p_user_id uuid,
  p_paddle_customer_id text,
  p_status text,
  p_price_id text,
  p_current_period_end timestamptz,
  p_event_occurred_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subscription public.subscriptions%rowtype;
  v_user_id uuid;
  v_business_id uuid;
  v_business_owner_id uuid;
  v_business_count integer;
begin
  if p_paddle_subscription_id is null or length(trim(p_paddle_subscription_id)) = 0 then
    raise exception 'Paddle subscription ID is required';
  end if;
  if p_status not in ('active', 'trialing', 'past_due', 'paused', 'canceled') then
    raise exception 'Unsupported Paddle subscription status';
  end if;
  if p_event_occurred_at is null then
    raise exception 'Paddle event occurrence time is required';
  end if;

  select *
    into v_subscription
    from public.subscriptions
    where paddle_subscription_id = p_paddle_subscription_id
    for update;

  if found then
    if v_subscription.user_id is not null
       and p_user_id is not null
       and v_subscription.user_id <> p_user_id then
      return jsonb_build_object('accepted', false, 'reason', 'owner_mismatch');
    end if;

    if v_subscription.user_id is null and p_user_id is null then
      return jsonb_build_object('accepted', false, 'reason', 'verified_owner_required');
    end if;

    if v_subscription.paddle_subscription_event_occurred_at is not null
       and p_event_occurred_at <= v_subscription.paddle_subscription_event_occurred_at then
      return jsonb_build_object('accepted', true, 'stale', true);
    end if;

    v_user_id := coalesce(v_subscription.user_id, p_user_id);
    v_business_id := v_subscription.business_id;

    if v_business_id is not null then
      select owner_id
        into v_business_owner_id
        from public.businesses
        where id = v_business_id;

      if not found or v_user_id is null or v_business_owner_id <> v_user_id then
        return jsonb_build_object('accepted', false, 'reason', 'business_owner_mismatch');
      end if;
    elsif v_user_id is not null then
      select count(*), (array_agg(id))[1]
        into v_business_count, v_business_id
        from public.businesses
        where owner_id = v_user_id;

      if v_business_count <> 1 then
        v_business_id := null;
      end if;
    end if;

    update public.subscriptions
      set user_id = v_user_id,
          business_id = v_business_id,
          paddle_customer_id = coalesce(p_paddle_customer_id, v_subscription.paddle_customer_id),
          status = p_status,
          price_id = coalesce(p_price_id, v_subscription.price_id),
          current_period_end = p_current_period_end,
          paddle_subscription_event_occurred_at = p_event_occurred_at,
          updated_at = now()
      where id = v_subscription.id;

    return jsonb_build_object('accepted', true, 'stale', false);
  end if;

  if p_user_id is null then
    return jsonb_build_object('accepted', false, 'reason', 'verified_owner_required');
  end if;

  v_user_id := p_user_id;
  v_business_id := null;

  select count(*), (array_agg(id))[1]
    into v_business_count, v_business_id
    from public.businesses
    where owner_id = v_user_id;

  if v_business_count <> 1 then
    v_business_id := null;
  end if;

  insert into public.subscriptions (
    user_id,
    business_id,
    paddle_customer_id,
    paddle_subscription_id,
    status,
    price_id,
    current_period_end,
    paddle_subscription_event_occurred_at,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    v_business_id,
    p_paddle_customer_id,
    p_paddle_subscription_id,
    p_status,
    p_price_id,
    p_current_period_end,
    p_event_occurred_at,
    now(),
    now()
  );

  return jsonb_build_object('accepted', true, 'stale', false);
end;
$$;

revoke all on function public.apply_paddle_subscription_event(text, uuid, text, text, text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_paddle_subscription_event(text, uuid, text, text, text, timestamptz, timestamptz) to service_role;
