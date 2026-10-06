-- =====================================================================================
-- Migration: 20261006000002_fix_owner_fcm_reliability.sql
-- Description:
-- 1. Ensure clean, single overload for register_owner_push_subscription with order_id = NULL
-- 2. Guard register_customer_orders_push and register_customer_push_subscription so OWNER
--    tokens are NEVER downgraded to CUSTOMER and NEVER have order_id/order_number attached
-- 3. Update handle_notification_fcm_push with distinct event keys & tags for OWNER events
--    while leaving CUSTOMER logic COMPLETELY UNTOUCHED
-- 4. Add OWNER notification on update_order_status so Owner devices get notified of status transitions
-- 5. Clean up any existing OWNER push subscriptions with stale order_id values
-- =====================================================================================

-- 1. Clean up existing OWNER subscriptions
UPDATE public.push_subscriptions
SET order_id = NULL,
    order_number = NULL,
    updated_at = now()
WHERE user_type = 'OWNER'
  AND (order_id IS NOT NULL OR order_number IS NOT NULL);

-- 2. Drop any legacy/conflicting overloads of register_owner_push_subscription
DROP FUNCTION IF EXISTS public.register_owner_push_subscription(text, text, text);
DROP FUNCTION IF EXISTS public.register_owner_push_subscription(text, text, text, text);

-- Recreate canonical register_owner_push_subscription
CREATE OR REPLACE FUNCTION public.register_owner_push_subscription(
    p_fcm_token text,
    p_device_id text DEFAULT NULL::text,
    p_platform text DEFAULT 'WEB'::text,
    p_old_fcm_token text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

    -- Deactivate only the specific old token if provided and different
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

GRANT EXECUTE ON FUNCTION public.register_owner_push_subscription(text, text, text, text) TO authenticated, service_role;

-- 3. Update register_customer_orders_push to strictly protect OWNER subscriptions
-- Drop any conflicting overloads first
DROP FUNCTION IF EXISTS public.register_customer_orders_push(text, text[], jsonb);
DROP FUNCTION IF EXISTS public.register_customer_orders_push(text, text[], text, text);

CREATE OR REPLACE FUNCTION public.register_customer_orders_push(
    p_fcm_token text,
    p_tracking_tokens text[],
    p_device_info jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_fcm text := trim(p_fcm_token);
    v_order record;
    v_linked_count int := 0;
    v_latest_order_id uuid := NULL;
    v_latest_order_number text := NULL;
    v_user_agent text := COALESCE((p_device_info->>'userAgent')::text, 'Customer Device');
BEGIN
    IF v_clean_fcm IS NULL OR length(v_clean_fcm) < 10 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid FCM token');
    END IF;

    IF p_tracking_tokens IS NOT NULL AND array_length(p_tracking_tokens, 1) > 0 THEN
        FOR v_order IN
            SELECT id, order_number 
            FROM public.orders 
            WHERE tracking_token = ANY(p_tracking_tokens)
            ORDER BY created_at DESC
        LOOP
            IF v_latest_order_id IS NULL THEN
                v_latest_order_id := v_order.id;
                v_latest_order_number := v_order.order_number;
            END IF;

            INSERT INTO public.customer_push_orders (fcm_token, order_id)
            VALUES (v_clean_fcm, v_order.id)
            ON CONFLICT (fcm_token, order_id) DO NOTHING;

            v_linked_count := v_linked_count + 1;
        END LOOP;
    END IF;

    -- Upsert in push_subscriptions:
    -- If already OWNER, NEVER change user_type to CUSTOMER and NEVER set order_id/order_number!
    INSERT INTO public.push_subscriptions (
        user_type,
        order_id,
        order_number,
        device_id,
        fcm_token,
        platform,
        is_active,
        last_seen_at,
        updated_at
    ) VALUES (
        'CUSTOMER',
        v_latest_order_id,
        v_latest_order_number,
        COALESCE(v_user_agent, 'browser-' || substr(md5(v_clean_fcm), 1, 8)),
        v_clean_fcm,
        'WEB',
        true,
        now(),
        now()
    )
    ON CONFLICT (fcm_token) DO UPDATE
    SET user_type = CASE WHEN public.push_subscriptions.user_type = 'OWNER' THEN 'OWNER' ELSE 'CUSTOMER' END,
        order_id = CASE WHEN public.push_subscriptions.user_type = 'OWNER' THEN NULL ELSE COALESCE(v_latest_order_id, public.push_subscriptions.order_id) END,
        order_number = CASE WHEN public.push_subscriptions.user_type = 'OWNER' THEN NULL ELSE COALESCE(v_latest_order_number, public.push_subscriptions.order_number) END,
        device_id = COALESCE(EXCLUDED.device_id, public.push_subscriptions.device_id),
        platform = COALESCE(EXCLUDED.platform, public.push_subscriptions.platform),
        is_active = true,
        last_seen_at = now(),
        updated_at = now();

    RETURN jsonb_build_object(
        'success', true,
        'linked_orders_count', v_linked_count,
        'fcm_token_prefix', substr(v_clean_fcm, 1, 10)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_customer_orders_push(text, text[], jsonb) TO anon, authenticated, service_role;

-- 4. Update register_customer_push_subscription with same OWNER protection
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
SET search_path = public
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

    -- Upsert device token: NEVER overwrite OWNER user_type and keep order_id = NULL for OWNER
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

    -- Always record customer push order link for multi-order tracking
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

GRANT EXECUTE ON FUNCTION public.register_customer_push_subscription(text, text, text, text, text) TO anon, authenticated, service_role;

-- 5. Update handle_notification_fcm_push:
-- Precise event keys and distinct notification tags for OWNER
-- CUSTOMER targeting & payload completely untouched
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
  v_event_key TEXT;
  v_event_type TEXT;
  v_notif_tag TEXT;
  v_tracking_token TEXT;
  v_order_number TEXT;
  v_action_url TEXT;
  v_payload JSONB;
BEGIN
  -- Load Supabase URL and service role key
  SELECT decrypted_secret INTO v_supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_URL'
  LIMIT 1;

  IF v_supabase_url IS NULL THEN
    v_supabase_url := current_setting('app.settings.supabase_url', true);
  END IF;

  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://uosceogqhwkjcksmyrjc.supabase.co';
  END IF;

  SELECT decrypted_secret INTO v_service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  IF v_service_role_key IS NULL THEN
    v_service_role_key := current_setting('app.settings.service_role_key', true);
  END IF;

  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    v_service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvc2Nlb2dxaHdramNrc215cmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzU0MjAsImV4cCI6MjEwNDcxMTQyMH0.20vQCjfZjeHtzFacGEkaY3_F8IudfPADtzBr1fVsji8';
  END IF;

  v_endpoint := rtrim(v_supabase_url, '/') || '/functions/v1/send-fcm-notification';

  IF NEW.order_id IS NOT NULL THEN
    SELECT tracking_token, order_number INTO v_tracking_token, v_order_number
    FROM public.orders
    WHERE id = NEW.order_id;
  END IF;

  IF NEW.recipient_type = 'OWNER' THEN
    -- Determine exact logical event type for OWNER
    IF NEW.title ILIKE '%New%Order%' THEN
      v_event_type := 'NEW_ORDER';
    ELSIF NEW.title ILIKE '%Payment%Verification%' OR NEW.title ILIKE '%Payment%Submitted%' THEN
      v_event_type := 'PAYMENT_SUBMITTED';
    ELSIF NEW.title ILIKE '%Accepted%' THEN
      v_event_type := 'ORDER_ACCEPTED';
    ELSIF NEW.title ILIKE '%Preparing%' OR NEW.title ILIKE '%Steaming%' THEN
      v_event_type := 'PREPARING';
    ELSIF NEW.title ILIKE '%Ready%' THEN
      v_event_type := 'READY';
    ELSIF NEW.title ILIKE '%Out for Delivery%' THEN
      v_event_type := 'OUT_FOR_DELIVERY';
    ELSIF NEW.title ILIKE '%Completed%' OR NEW.title ILIKE '%Served%' THEN
      v_event_type := 'COMPLETED';
    ELSIF NEW.title ILIKE '%Cancelled%' THEN
      v_event_type := 'CANCELLED';
    ELSE
      v_event_type := COALESCE(NEW.type, 'ALERT');
    END IF;

    -- Distinct logical event key per order & event (Section 2)
    IF NEW.order_id IS NOT NULL THEN
      v_event_key := 'OWNER_' || v_event_type || ':' || NEW.order_id::TEXT;
      v_notif_tag := 'owner-order-' || COALESCE(v_order_number, NEW.order_id::TEXT) || '-' || v_event_type || '-' || substr(NEW.id::TEXT, 1, 8);
    ELSE
      v_event_key := 'OWNER_NOTIF:' || NEW.id::TEXT;
      v_notif_tag := 'owner-' || NEW.id::TEXT;
    END IF;

    -- Select ALL active owner devices (Section 3)
    SELECT ARRAY_AGG(DISTINCT ps.fcm_token) INTO v_tokens
    FROM public.push_subscriptions ps
    WHERE ps.user_type = 'OWNER'
      AND ps.is_active = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_deliveries nd 
        WHERE nd.event_key = v_event_key AND nd.fcm_token = ps.fcm_token AND nd.status = 'SENT'
      );

    v_action_url := '/owner-dashboard';

  ELSIF NEW.recipient_type = 'CUSTOMER' AND NEW.order_id IS NOT NULL THEN
    -- CUSTOMER FLOW: EXACTLY AS PREVIOUSLY CONFIGURED (DO NOT ALTER)
    v_event_key := 'notif_' || NEW.id::TEXT;
    v_event_type := 'CUSTOMER_ORDER_UPDATE';
    v_notif_tag := CASE WHEN v_order_number IS NOT NULL AND v_order_number <> '' THEN 'order-' || v_order_number ELSE 'notif-' || NEW.id::TEXT END;

    SELECT ARRAY_AGG(DISTINCT ps.fcm_token) INTO v_tokens
    FROM public.push_subscriptions ps
    LEFT JOIN public.customer_push_orders cpo ON ps.fcm_token = cpo.fcm_token
    WHERE ps.is_active = TRUE
      AND (ps.order_id = NEW.order_id OR cpo.order_id = NEW.order_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_deliveries nd 
        WHERE nd.event_key = v_event_key AND nd.fcm_token = ps.fcm_token AND nd.status = 'SENT'
      );

    IF v_tracking_token IS NOT NULL AND v_tracking_token <> '' THEN
      v_action_url := '/?order_number=' || COALESCE(v_order_number, '') || '&token=' || v_tracking_token;
    ELSE
      v_action_url := '/';
    END IF;
  END IF;

  IF v_tokens IS NULL OR array_length(v_tokens, 1) IS NULL OR array_length(v_tokens, 1) = 0 THEN
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'title', NEW.title,
    'body', NEW.body,
    'tokens', to_jsonb(v_tokens),
    'url', COALESCE(v_action_url, '/'),
    'event_key', v_event_key,
    'data', jsonb_build_object(
      'notification_id', NEW.id::TEXT,
      'order_id', COALESCE(NEW.order_id::TEXT, ''),
      'order_number', COALESCE(v_order_number, ''),
      'tracking_token', COALESCE(v_tracking_token, ''),
      'type', COALESCE(NEW.type, 'GENERAL'),
      'event_type', COALESCE(v_event_type, 'ORDER'),
      'recipient_type', NEW.recipient_type,
      'tag', COALESCE(v_notif_tag, 'variety-momo-alert'),
      'url', COALESCE(v_action_url, '/'),
      'click_action', COALESCE(v_action_url, '/'),
      'site_url', 'https://variety-momo-jq8j.vercel.app',
      'event_key', v_event_key
    )
  );

  PERFORM net.http_post(
    url := v_endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_service_role_key,
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := v_payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[FCM TRIGGER ERROR] %: %', SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notification_fcm_push ON public.notifications;
CREATE TRIGGER trigger_notification_fcm_push
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_notification_fcm_push();

-- 6. Update update_order_status RPC: Add OWNER notification row alongside CUSTOMER notification
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_new_status TEXT,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_clean_status TEXT := trim(upper(p_new_status));
    v_customer_title TEXT;
    v_customer_body TEXT;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only restaurant owners can update order status.';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    -- Validate transitions
    IF v_order.order_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cancelled orders cannot be updated.';
    END IF;

    IF v_order.order_status = 'COMPLETED' AND v_clean_status <> 'COMPLETED' THEN
        RAISE EXCEPTION 'Completed orders cannot be moved backward.';
    END IF;

    IF v_order.order_type = 'DINE_IN' THEN
        IF v_order.order_status = 'PENDING' AND v_clean_status IN ('ACCEPTED', 'CANCELLED', 'REJECTED') THEN
        ELSIF v_order.order_status = 'ACCEPTED' AND v_clean_status IN ('PREPARING', 'CANCELLED') THEN
        ELSIF v_order.order_status = 'PREPARING' AND v_clean_status IN ('READY', 'CANCELLED') THEN
        ELSIF v_order.order_status = 'READY' AND v_clean_status IN ('SERVED', 'CANCELLED') THEN
        ELSIF v_order.order_status = 'SERVED' AND v_clean_status IN ('COMPLETED', 'CANCELLED') THEN
        ELSIF v_clean_status = 'CANCELLED' THEN
        ELSE
            RAISE EXCEPTION 'Invalid status transition for Dine-In order: % -> %', v_order.order_status, v_clean_status;
        END IF;
    ELSE
        -- Delivery order state machine
        IF v_order.payment_status = 'REJECTED' AND v_clean_status NOT IN ('CANCELLED', 'REJECTED') THEN
            RAISE EXCEPTION 'Cannot advance order with REJECTED payment.';
        END IF;

        IF v_order.order_status IN ('PENDING', 'AWAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED') AND v_clean_status IN ('ACCEPTED', 'CANCELLED', 'REJECTED') THEN
        ELSIF v_order.order_status = 'ACCEPTED' AND v_clean_status IN ('PREPARING', 'CANCELLED') THEN
        ELSIF v_order.order_status = 'PREPARING' AND v_clean_status IN ('READY', 'CANCELLED') THEN
        ELSIF v_order.order_status = 'READY' AND v_clean_status IN ('OUT_FOR_DELIVERY', 'CANCELLED') THEN
        ELSIF v_order.order_status = 'OUT_FOR_DELIVERY' AND v_clean_status IN ('COMPLETED', 'CANCELLED') THEN
        ELSIF v_clean_status = 'CANCELLED' THEN
        ELSE
            RAISE EXCEPTION 'Invalid status transition for Delivery order: % -> %', v_order.order_status, v_clean_status;
        END IF;
    END IF;

    -- Update order record
    UPDATE public.orders
    SET order_status = v_clean_status,
        updated_at = now()
    WHERE id = p_order_id;

    -- Record status history
    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by,
        note
    )
    VALUES (
        p_order_id,
        v_order.order_status,
        v_clean_status,
        auth.uid(),
        COALESCE(p_note, 'Status changed by restaurant owner')
    );

    -- Format customer notification message
    IF v_clean_status = 'ACCEPTED' THEN
        v_customer_title := 'Order Accepted: #' || v_order.order_number;
        v_customer_body := 'Variety Momo has accepted your order. Fresh preparation will begin shortly.';
    ELSIF v_clean_status = 'PREPARING' THEN
        v_customer_title := 'Momos are Steaming! #' || v_order.order_number;
        v_customer_body := 'Your order is being prepared fresh in the kitchen & wok.';
    ELSIF v_clean_status = 'READY' THEN
        IF v_order.order_type = 'DINE_IN' THEN
            v_customer_title := 'Order Ready: #' || v_order.order_number;
            v_customer_body := 'Your freshly steamed momos are ready for your table!';
        ELSE
            v_customer_title := 'Packed & Ready: #' || v_order.order_number;
            v_customer_body := 'Your order has been neatly packed and will head out for delivery soon.';
        END IF;
    ELSIF v_clean_status = 'SERVED' THEN
        v_customer_title := 'Order Served: #' || v_order.order_number;
        v_customer_body := 'Enjoy your meal! Please reach out to our staff for anything else.';
    ELSIF v_clean_status = 'OUT_FOR_DELIVERY' THEN
        v_customer_title := 'Out for Delivery: #' || v_order.order_number;
        v_customer_body := 'Our delivery partner is on the way with your steaming hot momos!';
    ELSIF v_clean_status = 'COMPLETED' THEN
        v_customer_title := 'Order Completed: #' || v_order.order_number;
        v_customer_body := 'Thank you for choosing Variety Momo! We hope you loved your food.';
    ELSE
        v_customer_title := 'Order ' || v_clean_status;
        v_customer_body := 'Your order status has been updated to: ' || v_clean_status;
    END IF;

    -- 1. CUSTOMER Notification (UNCHANGED FLOW)
    INSERT INTO public.notifications (
        recipient_type,
        order_id,
        title,
        body,
        type
    )
    VALUES (
        'CUSTOMER',
        p_order_id,
        v_customer_title,
        v_customer_body,
        'ORDER'
    );

    -- 2. OWNER Notification (Ensures owner devices receive status updates)
    INSERT INTO public.notifications (
        recipient_type,
        order_id,
        title,
        body,
        type
    )
    VALUES (
        'OWNER',
        p_order_id,
        'Order Status: ' || v_clean_status || ' (#' || v_order.order_number || ')',
        'Order #' || v_order.order_number || ' updated to ' || v_clean_status || ' • ' || v_order.customer_name,
        'ORDER'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'new_status', v_clean_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, TEXT) TO authenticated;
