-- Variety Momo STEP 5: Owner Dashboard, Payment Verification, Order Management, State Machine
-- Migration: 20260926000004_owner_dashboard_step5.sql

-- 1. Add cancellation columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Verify Payment RPC
CREATE OR REPLACE FUNCTION public.verify_order_payment(
    p_payment_id UUID,
    p_order_id UUID,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_payment RECORD;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Owner privileges required.';
    END IF;

    SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record not found.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order record not found.';
    END IF;

    -- Update payment
    UPDATE public.payments
    SET payment_status = 'VERIFIED',
        verified_at = now(),
        verified_by = auth.uid(),
        updated_at = now()
    WHERE id = p_payment_id;

    -- Audit record in payment_verifications
    INSERT INTO public.payment_verifications (
        payment_id,
        verified_by,
        verification_status,
        notes
    )
    VALUES (
        p_payment_id,
        auth.uid(),
        'VERIFIED',
        COALESCE(p_note, 'Verified manually by owner')
    );

    -- Update order
    UPDATE public.orders
    SET payment_status = 'VERIFIED',
        order_status = 'PAYMENT_VERIFIED',
        updated_at = now()
    WHERE id = p_order_id;

    -- Status history
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
        'PAYMENT_VERIFIED',
        auth.uid(),
        COALESCE(p_note, 'Advance payment verified by restaurant owner.')
    );

    -- Customer Notification
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
        'Advance Payment Verified',
        'Your advance payment has been verified by Variety Momo.',
        'ORDER'
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_status', 'VERIFIED',
        'order_status', 'PAYMENT_VERIFIED'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_order_payment(UUID, UUID, TEXT) TO authenticated;

-- 3. Reject Payment RPC
CREATE OR REPLACE FUNCTION public.reject_order_payment(
    p_payment_id UUID,
    p_order_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_payment RECORD;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Owner privileges required.';
    END IF;

    IF p_reason IS NULL OR length(trim(p_reason)) < 2 THEN
        RAISE EXCEPTION 'Please provide a valid reason for payment rejection.';
    END IF;

    SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record not found.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order record not found.';
    END IF;

    -- Update payment
    UPDATE public.payments
    SET payment_status = 'REJECTED',
        rejected_at = now(),
        rejection_reason = trim(p_reason),
        updated_at = now()
    WHERE id = p_payment_id;

    -- Audit record in payment_verifications
    INSERT INTO public.payment_verifications (
        payment_id,
        verified_by,
        verification_status,
        notes
    )
    VALUES (
        p_payment_id,
        auth.uid(),
        'REJECTED',
        trim(p_reason)
    );

    -- Update order
    UPDATE public.orders
    SET payment_status = 'REJECTED',
        order_status = 'REJECTED',
        updated_at = now()
    WHERE id = p_order_id;

    -- Status history
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
        'REJECTED',
        auth.uid(),
        'Payment rejected: ' || trim(p_reason)
    );

    -- Customer Notification
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
        'Payment Verification Rejected',
        'Payment could not be verified: ' || trim(p_reason),
        'ORDER'
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_status', 'REJECTED',
        'order_status', 'REJECTED'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_order_payment(UUID, UUID, TEXT) TO authenticated;

-- 4. Update Order Status with State Machine Validation
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
    v_clean_status TEXT;
    v_allowed BOOLEAN := false;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Owner privileges required.';
    END IF;

    v_clean_status := upper(trim(p_new_status));

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order record not found.';
    END IF;

    -- State machine rules
    IF v_order.order_type = 'DINE_IN' THEN
        -- Allowed: PENDING -> ACCEPTED -> PREPARING -> READY -> SERVED -> COMPLETED (or CANCELLED)
        IF v_order.order_status = 'PENDING' AND v_clean_status IN ('ACCEPTED', 'CANCELLED', 'REJECTED') THEN
            v_allowed := true;
        ELSIF v_order.order_status = 'ACCEPTED' AND v_clean_status IN ('PREPARING', 'CANCELLED') THEN
            v_allowed := true;
        ELSIF v_order.order_status = 'PREPARING' AND v_clean_status IN ('READY', 'CANCELLED') THEN
            v_allowed := true;
        ELSIF v_order.order_status = 'READY' AND v_clean_status IN ('SERVED', 'CANCELLED') THEN
            v_allowed := true;
        ELSIF v_order.order_status = 'SERVED' AND v_clean_status IN ('COMPLETED', 'CANCELLED') THEN
            v_allowed := true;
        ELSIF v_clean_status = 'CANCELLED' THEN
            v_allowed := true;
        END IF;

    ELSIF v_order.order_type = 'HOME_DELIVERY' THEN
        -- Rule 13: Do not allow ACCEPTED until required advance payment is verified
        IF v_clean_status = 'ACCEPTED' AND v_order.payment_status != 'VERIFIED' THEN
            RAISE EXCEPTION 'Cannot accept home delivery order until advance payment is verified.';
        END IF;

        IF v_order.payment_status = 'REJECTED' AND v_clean_status NOT IN ('CANCELLED', 'REJECTED') THEN
            RAISE EXCEPTION 'Cannot progress order with rejected payment.';
        END IF;

        IF v_order.order_status IN ('PENDING', 'AWAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED') AND v_clean_status IN ('ACCEPTED', 'CANCELLED', 'REJECTED') THEN
            v_allowed := true;
        ELSIF v_order.order_status = 'ACCEPTED' AND v_clean_status IN ('PREPARING', 'CANCELLED') THEN
            v_allowed := true;
        ELSIF v_order.order_status = 'PREPARING' AND v_clean_status IN ('READY', 'CANCELLED') THEN
            v_allowed := true;
        ELSIF v_order.order_status = 'READY' AND v_clean_status IN ('OUT_FOR_DELIVERY', 'CANCELLED') THEN
            v_allowed := true;
        ELSIF v_order.order_status = 'OUT_FOR_DELIVERY' AND v_clean_status IN ('COMPLETED', 'CANCELLED') THEN
            v_allowed := true;
        ELSIF v_clean_status = 'CANCELLED' THEN
            v_allowed := true;
        END IF;
    END IF;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Invalid status transition from "%" to "%".', v_order.order_status, v_clean_status;
    END IF;

    UPDATE public.orders
    SET order_status = v_clean_status,
        updated_at = now()
    WHERE id = p_order_id;

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

    -- Customer Notification
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
        'Order ' || v_clean_status,
        'Your order status has been updated to: ' || v_clean_status,
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

-- 5. Cancel Order RPC
CREATE OR REPLACE FUNCTION public.cancel_order(
    p_order_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Owner privileges required.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order record not found.';
    END IF;

    UPDATE public.orders
    SET order_status = 'CANCELLED',
        cancellation_reason = COALESCE(trim(p_reason), 'Cancelled by restaurant'),
        cancelled_at = now(),
        cancelled_by = auth.uid(),
        updated_at = now()
    WHERE id = p_order_id;

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
        'CANCELLED',
        auth.uid(),
        'Order cancelled: ' || COALESCE(trim(p_reason), 'No reason provided')
    );

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
        'Order Cancelled',
        'Your order was cancelled: ' || COALESCE(trim(p_reason), 'Contact restaurant for details.'),
        'ORDER'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_status', 'CANCELLED'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order(UUID, TEXT) TO authenticated;

-- 6. Dashboard Statistics RPC
CREATE OR REPLACE FUNCTION public.get_owner_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today_start TIMESTAMPTZ := date_trunc('day', now());
    v_today_orders INTEGER := 0;
    v_today_revenue NUMERIC(10,2) := 0;
    v_pending_count INTEGER := 0;
    v_payment_verification_count INTEGER := 0;
    v_accepted_count INTEGER := 0;
    v_preparing_count INTEGER := 0;
    v_ready_count INTEGER := 0;
    v_completed_count INTEGER := 0;
    v_cancelled_count INTEGER := 0;
    v_dine_in_count INTEGER := 0;
    v_delivery_count INTEGER := 0;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Owner privileges required.';
    END IF;

    -- Today's Orders Count
    SELECT COUNT(*) INTO v_today_orders
    FROM public.orders
    WHERE created_at >= v_today_start;

    -- Today's Revenue: Completed/Valid orders (excluding cancelled/rejected)
    SELECT COALESCE(SUM(grand_total), 0) INTO v_today_revenue
    FROM public.orders
    WHERE created_at >= v_today_start
      AND order_status IN ('COMPLETED', 'SERVED', 'OUT_FOR_DELIVERY', 'READY', 'PREPARING', 'ACCEPTED');

    -- Status Counts
    SELECT COUNT(*) INTO v_pending_count
    FROM public.orders
    WHERE order_status IN ('PENDING', 'AWAITING_PAYMENT');

    -- Payment Verifications Queue (Submitted payments needing review)
    SELECT COUNT(*) INTO v_payment_verification_count
    FROM public.payments
    WHERE payment_status = 'SUBMITTED';

    SELECT COUNT(*) INTO v_accepted_count
    FROM public.orders
    WHERE order_status = 'ACCEPTED';

    SELECT COUNT(*) INTO v_preparing_count
    FROM public.orders
    WHERE order_status = 'PREPARING';

    SELECT COUNT(*) INTO v_ready_count
    FROM public.orders
    WHERE order_status = 'READY';

    SELECT COUNT(*) INTO v_completed_count
    FROM public.orders
    WHERE order_status IN ('COMPLETED', 'SERVED');

    SELECT COUNT(*) INTO v_cancelled_count
    FROM public.orders
    WHERE order_status IN ('CANCELLED', 'REJECTED');

    SELECT COUNT(*) INTO v_dine_in_count
    FROM public.orders
    WHERE order_type = 'DINE_IN';

    SELECT COUNT(*) INTO v_delivery_count
    FROM public.orders
    WHERE order_type = 'HOME_DELIVERY';

    RETURN jsonb_build_object(
        'today_orders', v_today_orders,
        'today_revenue', v_today_revenue,
        'pending_orders', v_pending_count,
        'payment_verification', v_payment_verification_count,
        'accepted', v_accepted_count,
        'preparing', v_preparing_count,
        'ready', v_ready_count,
        'completed', v_completed_count,
        'cancelled', v_cancelled_count,
        'dine_in_orders', v_dine_in_count,
        'home_delivery_orders', v_delivery_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_owner_dashboard_stats() TO authenticated;
