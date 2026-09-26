-- STEP 7: ENHANCED ORDER TRACKING & TABLE QR RESOLUTION

-- 1. Table QR resolution accepting both token and table number (e.g. ?table=T1, ?table=1)
CREATE OR REPLACE FUNCTION public.validate_table_qr(p_qr_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_table RECORD;
    v_clean_token TEXT;
BEGIN
    IF p_qr_token IS NULL OR trim(p_qr_token) = '' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid or inactive table QR.');
    END IF;

    v_clean_token := trim(p_qr_token);

    SELECT id, table_number, is_active, qr_token
    INTO v_table
    FROM public.tables
    WHERE (
        qr_token = v_clean_token
        OR UPPER(table_number) = UPPER(v_clean_token)
        OR table_number = replace(UPPER(v_clean_token), 'T', '')
        OR UPPER('T' || table_number) = UPPER(v_clean_token)
    )
    AND is_active = true
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid or inactive table QR.');
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'table_id', v_table.id,
        'table_number', v_table.table_number,
        'qr_token', v_table.qr_token
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_table_qr(TEXT) TO anon, authenticated;

-- 2. Flexible and secure customer order retrieval by tracking token
CREATE OR REPLACE FUNCTION public.get_customer_order(
    p_order_number TEXT DEFAULT NULL,
    p_tracking_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_order RECORD;
    v_table_number TEXT := NULL;
    v_address_json JSONB := NULL;
    v_items JSONB;
    v_history JSONB;
    v_payments JSONB;
BEGIN
    IF (p_tracking_token IS NULL OR trim(p_tracking_token) = '') AND (p_order_number IS NULL OR trim(p_order_number) = '') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tracking token or order number is required.');
    END IF;

    -- Lookup order: tracking token is required for security/privacy
    IF p_tracking_token IS NOT NULL AND trim(p_tracking_token) <> '' THEN
        IF p_order_number IS NOT NULL AND trim(p_order_number) <> '' THEN
            SELECT * INTO v_order
            FROM public.orders
            WHERE order_number = trim(p_order_number)
              AND tracking_token = trim(p_tracking_token);
        ELSE
            SELECT * INTO v_order
            FROM public.orders
            WHERE tracking_token = trim(p_tracking_token);
        END IF;
    ELSE
        -- Order number alone without token is rejected to prevent enumeration/leaks
        RETURN jsonb_build_object('success', false, 'error', 'Secure tracking token is required to view order details.');
    END IF;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found or invalid tracking token.');
    END IF;

    -- If Dine-in, fetch table details
    IF v_order.table_id IS NOT NULL THEN
        SELECT table_number INTO v_table_number
        FROM public.tables WHERE id = v_order.table_id;
    END IF;

    -- If Delivery, fetch address & zone details
    IF v_order.delivery_address_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'address_line', a.address_line,
            'area', a.area,
            'landmark', a.landmark,
            'city', a.city,
            'pincode', a.pincode,
            'zone_name', z.name
        ) INTO v_address_json
        FROM public.customer_addresses a
        LEFT JOIN public.delivery_zones z ON a.delivery_zone_id = z.id
        WHERE a.id = v_order.delivery_address_id;
    END IF;

    -- Fetch order items
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', oi.id,
            'name', oi.item_name_snapshot,
            'price', oi.unit_price_snapshot,
            'quantity', oi.quantity,
            'line_total', oi.line_total
        )
    ) INTO v_items
    FROM public.order_items oi
    WHERE oi.order_id = v_order.id;

    -- Fetch status history
    SELECT jsonb_agg(
        jsonb_build_object(
            'status', h.status,
            'note', h.note,
            'created_at', h.created_at
        ) ORDER BY h.created_at ASC
    ) INTO v_history
    FROM public.order_status_history h
    WHERE h.order_id = v_order.id;

    -- Fetch payment records
    SELECT jsonb_agg(
        jsonb_build_object(
            'payment_type', p.payment_type,
            'amount', p.amount,
            'payment_status', p.payment_status,
            'customer_reference', p.customer_reference,
            'submitted_at', p.submitted_at,
            'verified_at', p.verified_at
        ) ORDER BY p.created_at DESC
    ) INTO v_payments
    FROM public.payments p
    WHERE p.order_id = v_order.id;

    RETURN jsonb_build_object(
        'success', true,
        'order', jsonb_build_object(
            'id', v_order.id,
            'order_number', v_order.order_number,
            'tracking_token', v_order.tracking_token,
            'order_type', v_order.order_type,
            'customer_name', v_order.customer_name,
            'customer_phone', v_order.customer_phone,
            'subtotal', v_order.subtotal,
            'delivery_charge', v_order.delivery_charge,
            'grand_total', v_order.grand_total,
            'advance_amount', v_order.advance_amount,
            'cod_amount', v_order.cod_amount,
            'order_status', v_order.order_status,
            'payment_status', v_order.payment_status,
            'payment_reference', v_order.payment_reference,
            'table_number', v_table_number,
            'address', v_address_json,
            'created_at', v_order.created_at
        ),
        'items', COALESCE(v_items, '[]'::jsonb),
        'history', COALESCE(v_history, '[]'::jsonb),
        'payments', COALESCE(v_payments, '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_order(TEXT, TEXT) TO anon, authenticated;
