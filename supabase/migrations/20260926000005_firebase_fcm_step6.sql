-- ============================================================================
-- STEP 6: FIREBASE CLOUD MESSAGING (FCM) PUSH NOTIFICATIONS FOUNDATION
-- Secure push_subscriptions management, event routing & owner/customer isolation
-- ============================================================================

-- Ensure push_subscriptions schema
ALTER TABLE public.push_subscriptions 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS order_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_fcm_token ON public.push_subscriptions(fcm_token);
CREATE INDEX IF NOT EXISTS idx_push_subs_user_type ON public.push_subscriptions(user_type, is_active);
CREATE INDEX IF NOT EXISTS idx_push_subs_order_id ON public.push_subscriptions(order_id);

-- 1. Register Owner Push Subscription (Owner Auth Required)
CREATE OR REPLACE FUNCTION public.register_owner_push_subscription(
    p_fcm_token TEXT,
    p_device_id TEXT DEFAULT NULL,
    p_platform TEXT DEFAULT 'WEB'
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

-- 2. Register Customer Push Subscription for an Order (Tracking Token Auth)
CREATE OR REPLACE FUNCTION public.register_customer_push_subscription(
    p_order_number TEXT,
    p_tracking_token TEXT,
    p_fcm_token TEXT,
    p_device_id TEXT DEFAULT NULL,
    p_platform TEXT DEFAULT 'WEB'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_order RECORD;
    v_sub_id UUID;
BEGIN
    -- Verify order by non-guessable tracking token
    SELECT id, order_number INTO v_order
    FROM public.orders
    WHERE order_number = trim(p_order_number)
      AND tracking_token = trim(p_tracking_token);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found or tracking token invalid.';
    END IF;

    IF p_fcm_token IS NULL OR length(trim(p_fcm_token)) < 10 THEN
        RAISE EXCEPTION 'Invalid FCM registration token.';
    END IF;

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
        COALESCE(p_device_id, 'browser-' || substr(md5(p_fcm_token), 1, 8)),
        trim(p_fcm_token),
        COALESCE(p_platform, 'WEB'),
        true,
        now(),
        now()
    )
    ON CONFLICT (fcm_token) DO UPDATE
    SET user_type = 'CUSTOMER',
        order_id = v_order.id,
        order_number = v_order.order_number,
        is_active = true,
        last_seen_at = now(),
        updated_at = now()
    RETURNING id INTO v_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_sub_id,
        'order_number', v_order.order_number
    );
END;
$$;

-- 3. Deactivate Push Subscription
CREATE OR REPLACE FUNCTION public.deactivate_push_subscription(
    p_fcm_token TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.push_subscriptions
    SET is_active = false,
        updated_at = now()
    WHERE fcm_token = trim(p_fcm_token);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Get FCM Tokens for Push Dispatch
CREATE OR REPLACE FUNCTION public.get_push_tokens_for_event(
    p_recipient_type TEXT,
    p_order_id UUID DEFAULT NULL
)
RETURNS TABLE (fcm_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF p_recipient_type = 'OWNER' THEN
        RETURN QUERY
        SELECT ps.fcm_token
        FROM public.push_subscriptions ps
        WHERE ps.user_type = 'OWNER'
          AND ps.is_active = true;
    ELSIF p_recipient_type = 'CUSTOMER' AND p_order_id IS NOT NULL THEN
        RETURN QUERY
        SELECT ps.fcm_token
        FROM public.push_subscriptions ps
        WHERE ps.user_type = 'CUSTOMER'
          AND ps.order_id = p_order_id
          AND ps.is_active = true;
    END IF;
END;
$$;
