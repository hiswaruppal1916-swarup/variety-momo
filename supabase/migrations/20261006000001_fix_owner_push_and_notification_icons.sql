-- =====================================================================================
-- Migration: 20261006000001_fix_owner_push_and_notification_icons.sql
-- Description:
-- 1. Ensure register_owner_push_subscription sets order_id = NULL and is_active = true
-- 2. Prevent register_customer_push_subscription from setting order_id on OWNER tokens
-- 3. Format owner notification titles & bodies for new orders & advance payment verification
-- =====================================================================================

-- 1. Owner push registration function
CREATE OR REPLACE FUNCTION public.register_owner_push_subscription(
    p_fcm_token text,
    p_device_id text DEFAULT NULL::text,
    p_platform text DEFAULT 'WEB'::text,
    p_old_fcm_token text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sub_id UUID;
    v_clean_token TEXT := trim(p_fcm_token);
    v_old_token TEXT := trim(COALESCE(p_old_fcm_token, ''));
    v_device TEXT;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only the restaurant owner can register owner push notifications.';
    END IF;

    IF v_clean_token IS NULL OR length(v_clean_token) < 10 THEN
        RAISE EXCEPTION 'Invalid FCM registration token.';
    END IF;

    -- Deactivate old token if provided and different
    IF v_old_token <> '' AND v_old_token <> v_clean_token THEN
        UPDATE public.push_subscriptions
        SET is_active = false,
            updated_at = now()
        WHERE fcm_token = v_old_token
          AND user_type = 'OWNER';
    END IF;

    v_device := COALESCE(p_device_id, 'browser-' || substr(md5(v_clean_token), 1, 8));

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
        'OWNER',
        auth.uid(),
        NULL,
        NULL,
        v_device,
        v_clean_token,
        COALESCE(p_platform, 'WEB'),
        true,
        now(),
        now()
    )
    ON CONFLICT (fcm_token) DO UPDATE
    SET user_type = 'OWNER',
        user_id = auth.uid(),
        order_id = NULL,
        order_number = NULL,
        device_id = COALESCE(EXCLUDED.device_id, public.push_subscriptions.device_id),
        platform = COALESCE(EXCLUDED.platform, public.push_subscriptions.platform),
        is_active = true,
        last_seen_at = now(),
        updated_at = now()
    RETURNING id INTO v_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_sub_id,
        'user_type', 'OWNER',
        'is_active', true
    );
END;
$$;

-- 2. Customer push registration function (protects OWNER subscriptions from order_id overwrite)
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
AS $$
DECLARE
    v_order RECORD;
    v_sub_id UUID;
    v_token_clean TEXT := trim(p_fcm_token);
BEGIN
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

    -- Upsert device token, preserving OWNER user_type and keeping order_id = NULL for OWNER
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
        order_id = CASE WHEN public.push_subscriptions.user_type = 'OWNER' THEN NULL ELSE v_order.id END,
        order_number = CASE WHEN public.push_subscriptions.user_type = 'OWNER' THEN NULL ELSE v_order.order_number END,
        device_id = COALESCE(EXCLUDED.device_id, public.push_subscriptions.device_id),
        platform = COALESCE(EXCLUDED.platform, public.push_subscriptions.platform),
        is_active = true,
        last_seen_at = now(),
        updated_at = now()
    RETURNING id INTO v_sub_id;

    -- Always link token to order for customer order history tracking
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

-- 3. Advance payment submission notification update
CREATE OR REPLACE FUNCTION public.submit_order_payment(
    p_order_number text,
    p_tracking_token text,
    p_payment_reference text,
    p_payment_amount numeric DEFAULT NULL::numeric,
    p_note text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_amount NUMERIC(10,2);
BEGIN
    IF p_payment_reference IS NULL OR length(trim(p_payment_reference)) < 3 THEN
        RAISE EXCEPTION 'Please provide a valid PhonePe transaction or UTR reference number.';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE order_number = trim(p_order_number) 
      AND tracking_token = trim(p_tracking_token);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found or tracking token is invalid.';
    END IF;

    IF v_order.order_type = 'DINE_IN' THEN
        RAISE EXCEPTION 'Dine-In orders are billed and paid at the counter.';
    END IF;

    IF v_order.payment_status = 'VERIFIED' THEN
        RAISE EXCEPTION 'Payment for this order has already been verified by the restaurant.';
    END IF;

    v_amount := COALESCE(p_payment_amount, v_order.advance_amount);

    INSERT INTO public.payments (
        order_id,
        payment_type,
        amount,
        payment_status,
        customer_reference,
        submitted_at
    )
    VALUES (
        v_order.id,
        'PHONEPE_QR_MANUAL',
        v_amount,
        'SUBMITTED',
        trim(p_payment_reference),
        now()
    );

    UPDATE public.orders
    SET payment_reference = trim(p_payment_reference),
        payment_status = 'SUBMITTED',
        order_status = 'PAYMENT_SUBMITTED',
        updated_at = now()
    WHERE id = v_order.id;

    INSERT INTO public.order_status_history (
        order_id,
        new_status,
        note
    )
    VALUES (
        v_order.id,
        'PAYMENT_SUBMITTED',
        COALESCE(p_note, 'Customer submitted PhonePe UTR: ' || trim(p_payment_reference))
    );

    INSERT INTO public.notifications (
        recipient_type,
        order_id,
        title,
        body,
        type,
        is_read
    )
    VALUES (
        'OWNER',
        v_order.id,
        'Payment Verification Required: #' || v_order.order_number,
        'Advance payment submitted for Order #' || v_order.order_number || '. UTR: ' || trim(p_payment_reference) || ' (₹' || v_amount || ')',
        'ORDER',
        false
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_number', v_order.order_number,
        'payment_status', 'SUBMITTED',
        'order_status', 'PAYMENT_SUBMITTED',
        'submitted_at', now()
    );
END;
$$;
