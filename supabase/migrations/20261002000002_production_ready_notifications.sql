-- ============================================================================
-- PRODUCTION-READY NOTIFICATION SYSTEM: Variety Momo
-- 1. Multi-device push subscriptions
-- 2. Customer order isolation with multiple orders per device
-- 3. Server-side FCM dispatch trigger via net.http_post
-- 4. Delete & Mark-Read RPCs for Owner and Customer notifications
-- ============================================================================

-- Ensure pg_net extension is available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Table to map customer device FCM tokens to multiple orders placed on that device
CREATE TABLE IF NOT EXISTS public.customer_push_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fcm_token TEXT NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (fcm_token, order_id)
);

CREATE INDEX IF NOT EXISTS idx_cpo_order_id ON public.customer_push_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_cpo_fcm_token ON public.customer_push_orders(fcm_token);

-- Enable RLS on customer_push_orders
ALTER TABLE public.customer_push_orders ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated to register their token-order pair via security definer RPCs
DROP POLICY IF EXISTS "Customer Push Orders Public Insert" ON public.customer_push_orders;
CREATE POLICY "Customer Push Orders Public Insert" ON public.customer_push_orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Customer Push Orders Read Owner" ON public.customer_push_orders;
CREATE POLICY "Customer Push Orders Read Owner" ON public.customer_push_orders
    FOR SELECT USING (is_owner());

-- Ensure unique index on fcm_token in push_subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_fcm_token ON public.push_subscriptions (fcm_token);

-- ----------------------------------------------------------------------------
-- 1. RPC: Register Owner Push Subscription (Multi-Device Support)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_owner_push_subscription(
    p_fcm_token text,
    p_device_id text DEFAULT NULL::text,
    p_platform text DEFAULT 'WEB'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_sub_id UUID;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only the restaurant owner can register owner push notifications.';
    END IF;

    IF p_fcm_token IS NULL OR length(trim(p_fcm_token)) < 10 THEN
        RAISE EXCEPTION 'Invalid FCM registration token.';
    END IF;

    INSERT INTO public.push_subscriptions (
        user_type,
        user_id,
        device_id,
        fcm_token,
        platform,
        is_active,
        last_seen_at,
        updated_at
    )
    VALUES (
        'OWNER',
        auth.uid(),
        COALESCE(p_device_id, 'browser-' || substr(md5(p_fcm_token), 1, 8)),
        trim(p_fcm_token),
        COALESCE(p_platform, 'WEB'),
        true,
        now(),
        now()
    )
    ON CONFLICT (fcm_token) DO UPDATE
    SET user_type = 'OWNER',
        user_id = auth.uid(),
        device_id = COALESCE(EXCLUDED.device_id, public.push_subscriptions.device_id),
        platform = COALESCE(EXCLUDED.platform, public.push_subscriptions.platform),
        is_active = true,
        last_seen_at = now(),
        updated_at = now()
    RETURNING id INTO v_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_sub_id,
        'user_type', 'OWNER'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. RPC: Register Customer Push Subscription (Strict Isolation + Multi-Order)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_customer_push_subscription(
    p_order_number text,
    p_tracking_token text,
    p_fcm_token text,
    p_device_id text DEFAULT NULL::text,
    p_platform text DEFAULT 'WEB'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_order RECORD;
    v_sub_id UUID;
    v_token_clean TEXT := trim(p_fcm_token);
BEGIN
    -- Verify order ownership by non-guessable tracking token
    SELECT id, order_number INTO v_order
    FROM public.orders
    WHERE order_number = trim(p_order_number)
      AND tracking_token = trim(p_tracking_token);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found or tracking token invalid.';
    END IF;

    IF v_token_clean IS NULL OR length(v_token_clean) < 10 THEN
        RAISE EXCEPTION 'Invalid FCM registration token.';
    END IF;

    -- Upsert the device token as a CUSTOMER subscription
    INSERT INTO public.push_subscriptions (
        user_type,
        user_id,
        order_id,
        order_number,
        device_id,
        fcm_token,
        platform,
        is_active,
        last_seen_at,
        updated_at
    )
    VALUES (
        'CUSTOMER',
        NULL,
        v_order.id,
        v_order.order_number,
        COALESCE(p_device_id, 'browser-' || substr(md5(v_token_clean), 1, 8)),
        v_token_clean,
        COALESCE(p_platform, 'WEB'),
        true,
        now(),
        now()
    )
    ON CONFLICT (fcm_token) DO UPDATE
    SET user_type = CASE WHEN public.push_subscriptions.user_type = 'OWNER' THEN 'OWNER' ELSE 'CUSTOMER' END,
        order_id = v_order.id,
        order_number = v_order.order_number,
        device_id = COALESCE(EXCLUDED.device_id, public.push_subscriptions.device_id),
        platform = COALESCE(EXCLUDED.platform, public.push_subscriptions.platform),
        is_active = true,
        last_seen_at = now(),
        updated_at = now()
    RETURNING id INTO v_sub_id;

    -- Also link token to this specific order in customer_push_orders for multi-order tracking
    INSERT INTO public.customer_push_orders (fcm_token, order_id)
    VALUES (v_token_clean, v_order.id)
    ON CONFLICT (fcm_token, order_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_sub_id,
        'order_number', v_order.order_number
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. RPC: Get Push Tokens for Event (All active Owner devices & Target Customer devices)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_push_tokens_for_event(
    p_recipient_type text,
    p_order_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(fcm_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF p_recipient_type = 'OWNER' THEN
        -- Send to ALL active owner devices / sessions
        RETURN QUERY
        SELECT DISTINCT ps.fcm_token
        FROM public.push_subscriptions ps
        WHERE ps.user_type = 'OWNER'
          AND ps.is_active = true;

    ELSIF p_recipient_type = 'CUSTOMER' AND p_order_id IS NOT NULL THEN
        -- Send ONLY to devices subscribed to this specific order
        RETURN QUERY
        SELECT DISTINCT ps.fcm_token
        FROM public.push_subscriptions ps
        LEFT JOIN public.customer_push_orders cpo ON ps.fcm_token = cpo.fcm_token
        WHERE ps.is_active = true
          AND (ps.order_id = p_order_id OR cpo.order_id = p_order_id);
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. RPCs: Delete & Delete All for Owner Notifications
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_owner_notification(p_notification_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only owner can delete owner notifications.';
    END IF;

    DELETE FROM public.notifications
    WHERE id = p_notification_id
      AND recipient_type = 'OWNER';

    RETURN jsonb_build_object('success', true, 'id', p_notification_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_all_owner_notifications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_count integer;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only owner can delete owner notifications.';
    END IF;

    DELETE FROM public.notifications
    WHERE recipient_type = 'OWNER';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN jsonb_build_object('success', true, 'deleted_count', v_count);
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. RPCs: Delete & Delete All for Customer Notifications (Strict Token Isolation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_customer_notification(
    p_notification_id uuid,
    p_tracking_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF p_tracking_token IS NULL OR trim(p_tracking_token) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tracking token required.');
    END IF;

    DELETE FROM public.notifications n
    USING public.orders o
    WHERE n.id = p_notification_id
      AND n.order_id = o.id
      AND n.recipient_type = 'CUSTOMER'
      AND o.tracking_token = trim(p_tracking_token);

    RETURN jsonb_build_object('success', true, 'id', p_notification_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_all_customer_notifications(p_tokens text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_count integer;
BEGIN
    IF p_tokens IS NULL OR array_length(p_tokens, 1) = 0 THEN
        RETURN jsonb_build_object('success', true, 'deleted_count', 0);
    END IF;

    DELETE FROM public.notifications n
    USING public.orders o
    WHERE n.order_id = o.id
      AND n.recipient_type = 'CUSTOMER'
      AND o.tracking_token = ANY(p_tokens);

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN jsonb_build_object('success', true, 'deleted_count', v_count);
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Trigger: Server-Side Automatic FCM Push on Notification Creation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_notification_fcm_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_tokens text[];
    v_url text := '/';
    v_order_number text := '';
    v_tracking_token text := '';
BEGIN
    -- Determine target tokens and URL
    IF NEW.recipient_type = 'OWNER' THEN
        SELECT array_agg(DISTINCT fcm_token) INTO v_tokens
        FROM public.push_subscriptions
        WHERE user_type = 'OWNER'
          AND is_active = true;

        IF NEW.order_id IS NOT NULL THEN
            v_url := '/owner-dashboard?order_id=' || NEW.order_id::text;
        ELSE
            v_url := '/owner-dashboard';
        END IF;

    ELSIF NEW.recipient_type = 'CUSTOMER' AND NEW.order_id IS NOT NULL THEN
        -- Get order number and tracking token for customer click action
        SELECT order_number, tracking_token 
        INTO v_order_number, v_tracking_token
        FROM public.orders
        WHERE id = NEW.order_id;

        -- Find active customer tokens registered for this order
        SELECT array_agg(DISTINCT fcm_token) INTO v_tokens
        FROM (
            SELECT ps.fcm_token
            FROM public.push_subscriptions ps
            WHERE ps.is_active = true
              AND ps.order_id = NEW.order_id
            UNION
            SELECT cpo.fcm_token
            FROM public.customer_push_orders cpo
            JOIN public.push_subscriptions ps ON cpo.fcm_token = ps.fcm_token
            WHERE ps.is_active = true
              AND cpo.order_id = NEW.order_id
        ) sub;

        IF v_order_number IS NOT NULL AND v_tracking_token IS NOT NULL THEN
            v_url := '/?order_number=' || v_order_number || '&token=' || v_tracking_token;
        ELSE
            v_url := '/';
        END IF;
    END IF;

    -- If active target tokens exist, send server-side push via net.http_post to Edge Function
    IF v_tokens IS NOT NULL AND array_length(v_tokens, 1) > 0 THEN
        PERFORM net.http_post(
            url := 'https://uosceogqhwkjcksmyrjc.supabase.co/functions/v1/send-fcm-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvc2Nlb2dxaHdramNrc215cmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzU0MjAsImV4cCI6MjEwNDcxMTQyMH0.20vQCjfZjeHtzFacGEkaY3_F8IudfPADtzBr1fVsji8',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvc2Nlb2dxaHdramNrc215cmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzU0MjAsImV4cCI6MjEwNDcxMTQyMH0.20vQCjfZjeHtzFacGEkaY3_F8IudfPADtzBr1fVsji8'
            ),
            body := jsonb_build_object(
                'title', NEW.title,
                'body', NEW.body,
                'tokens', to_jsonb(v_tokens),
                'url', v_url,
                'data', jsonb_build_object(
                    'order_id', COALESCE(NEW.order_id::text, ''),
                    'order_number', COALESCE(v_order_number, ''),
                    'click_action', v_url,
                    'notification_id', NEW.id::text,
                    'recipient_type', NEW.recipient_type
                )
            )
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Never abort the transaction if push delivery encounters a warning
        RAISE WARNING 'FCM push notification dispatch warning: %', SQLERRM;
        RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notification_fcm_push ON public.notifications;
CREATE TRIGGER trigger_notification_fcm_push
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_notification_fcm_push();
