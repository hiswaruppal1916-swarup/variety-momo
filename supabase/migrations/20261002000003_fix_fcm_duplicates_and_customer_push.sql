-- Migration: 20261002000003_fix_fcm_duplicates_and_customer_push.sql
-- Fix FCM duplicate notifications for owners and enable customer device push delivery

-- 1. Create notification deliveries deduplication table
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL,
  fcm_token TEXT NOT NULL,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'DELIVERED',
  CONSTRAINT uq_notification_deliveries UNIQUE(event_key, fcm_token)
);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on notification_deliveries"
  ON public.notification_deliveries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read on notification_deliveries"
  ON public.notification_deliveries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_event_token 
  ON public.notification_deliveries(event_key, fcm_token);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_created 
  ON public.notification_deliveries(delivered_at DESC);

-- 2. RPC to register customer orders push tokens
CREATE OR REPLACE FUNCTION public.register_customer_orders_push(
  p_fcm_token TEXT,
  p_tracking_tokens TEXT[],
  p_device_info JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_id UUID;
  v_order RECORD;
  v_linked_count INT := 0;
BEGIN
  IF p_fcm_token IS NULL OR trim(p_fcm_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token is required');
  END IF;

  INSERT INTO public.push_subscriptions (fcm_token, user_type, is_active, device_info, updated_at)
  VALUES (p_fcm_token, 'CUSTOMER', TRUE, COALESCE(p_device_info, '{}'::jsonb), NOW())
  ON CONFLICT (fcm_token) 
  DO UPDATE SET
    is_active = TRUE,
    device_info = COALESCE(p_device_info, push_subscriptions.device_info),
    updated_at = NOW()
  RETURNING id INTO v_sub_id;

  IF p_tracking_tokens IS NOT NULL AND array_length(p_tracking_tokens, 1) > 0 THEN
    FOR v_order IN 
      SELECT id FROM public.orders 
      WHERE tracking_token = ANY(p_tracking_tokens)
    LOOP
      INSERT INTO public.customer_push_orders (subscription_id, order_id)
      VALUES (v_sub_id, v_order.id)
      ON CONFLICT (subscription_id, order_id) DO NOTHING;
      v_linked_count := v_linked_count + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'subscription_id', v_sub_id, 'linked_orders', v_linked_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_customer_orders_push(TEXT, TEXT[], JSONB) TO anon, authenticated, service_role;

-- 3. Update handle_notification_fcm_push trigger function
CREATE OR REPLACE FUNCTION public.handle_notification_fcm_push()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
  v_endpoint TEXT;
  v_tokens TEXT[] := ARRAY[]::TEXT[];
  v_target_token TEXT;
  v_event_key TEXT;
  v_tracking_token TEXT;
  v_order_number TEXT;
  v_action_url TEXT;
  v_payload JSONB;
BEGIN
  SELECT decrypted_secret INTO v_supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_URL'
  LIMIT 1;

  IF v_supabase_url IS NULL THEN
    v_supabase_url := current_setting('app.settings.supabase_url', true);
  END IF;

  SELECT decrypted_secret INTO v_service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  IF v_service_role_key IS NULL THEN
    v_service_role_key := current_setting('app.settings.service_role_key', true);
  END IF;

  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    RAISE LOG '[FCM TRIGGER] Supabase URL not configured, skipping push';
    RETURN NEW;
  END IF;

  v_endpoint := rtrim(v_supabase_url, '/') || '/functions/v1/send-fcm-notification';
  v_event_key := 'notif_' || NEW.id::TEXT;

  IF NEW.order_id IS NOT NULL THEN
    SELECT tracking_token, order_number INTO v_tracking_token, v_order_number
    FROM public.orders
    WHERE id = NEW.order_id;
  END IF;

  IF NEW.recipient_type = 'OWNER' THEN
    SELECT ARRAY_AGG(DISTINCT ps.fcm_token) INTO v_tokens
    FROM public.push_subscriptions ps
    WHERE ps.user_type = 'OWNER'
      AND ps.is_active = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_deliveries nd 
        WHERE nd.event_key = v_event_key AND nd.fcm_token = ps.fcm_token
      );
    v_action_url := '/owner/orders';
  ELSIF NEW.recipient_type = 'CUSTOMER' AND NEW.order_id IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT ps.fcm_token) INTO v_tokens
    FROM public.customer_push_orders cpo
    JOIN public.push_subscriptions ps ON ps.id = cpo.subscription_id
    WHERE cpo.order_id = NEW.order_id
      AND ps.is_active = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_deliveries nd 
        WHERE nd.event_key = v_event_key AND nd.fcm_token = ps.fcm_token
      );
    IF v_tracking_token IS NOT NULL THEN
      v_action_url := '/order/track?token=' || v_tracking_token;
    ELSE
      v_action_url := '/';
    END IF;
  END IF;

  IF v_tokens IS NULL OR array_length(v_tokens, 1) IS NULL OR array_length(v_tokens, 1) = 0 THEN
    RETURN NEW;
  END IF;

  FOREACH v_target_token IN ARRAY v_tokens LOOP
    INSERT INTO public.notification_deliveries (event_key, fcm_token, notification_id, status)
    VALUES (v_event_key, v_target_token, NEW.id, 'DISPATCHED')
    ON CONFLICT (event_key, fcm_token) DO NOTHING;
  END LOOP;

  v_payload := jsonb_build_object(
    'title', NEW.title,
    'body', NEW.message,
    'tokens', to_jsonb(v_tokens),
    'event_key', v_event_key,
    'data', jsonb_build_object(
      'notification_id', NEW.id::TEXT,
      'order_id', COALESCE(NEW.order_id::TEXT, ''),
      'order_number', COALESCE(v_order_number, ''),
      'tracking_token', COALESCE(v_tracking_token, ''),
      'type', COALESCE(NEW.type, 'GENERAL'),
      'recipient_type', NEW.recipient_type,
      'url', COALESCE(v_action_url, '/'),
      'event_key', v_event_key
    )
  );

  PERFORM net.http_post(
    url := v_endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_service_role_key, '')
    ),
    body := v_payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[FCM TRIGGER ERROR] %: %', SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;
