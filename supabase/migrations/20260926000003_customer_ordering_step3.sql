-- Variety Momo STEP 3: Customer Ordering, Dine-In, Delivery, Secure Order Functions
-- Migration: 20260926000003_customer_ordering_step3.sql

-- 1. Grant public execute on is_owner so anonymous users can read available menu items, tables, zones
GRANT EXECUTE ON FUNCTION public.is_owner() TO anon, authenticated;

-- 2. Add tracking_token to orders for non-guessable customer order lookup
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '');

CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders(tracking_token);

-- 3. Collision-safe daily order sequences table
CREATE TABLE IF NOT EXISTS public.order_sequences (
    order_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    last_val INTEGER NOT NULL DEFAULT 0
);

-- Function to generate collision-safe human-readable order number: VM-YYYYMMDD-001
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_seq INTEGER;
    v_date_str TEXT;
BEGIN
    INSERT INTO public.order_sequences (order_date, last_val)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (order_date) 
    DO UPDATE SET last_val = public.order_sequences.last_val + 1
    RETURNING last_val INTO v_seq;

    v_date_str := to_char(CURRENT_DATE, 'YYYYMMDD');
    RETURN 'VM-' || v_date_str || '-' || lpad(v_seq::text, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_order_number() TO anon, authenticated;

-- 4. Function to validate table QR token
CREATE OR REPLACE FUNCTION public.validate_table_qr(p_qr_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_table RECORD;
BEGIN
    IF p_qr_token IS NULL OR trim(p_qr_token) = '' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid or inactive table QR.');
    END IF;

    SELECT id, table_number, is_active
    INTO v_table
    FROM public.tables
    WHERE qr_token = trim(p_qr_token) AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid or inactive table QR.');
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'table_id', v_table.id,
        'table_number', v_table.table_number
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_table_qr(TEXT) TO anon, authenticated;

-- 5. Authoritative atomic order creation function
CREATE OR REPLACE FUNCTION public.create_customer_order(
    p_order_type TEXT,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_items JSONB,
    p_table_token TEXT DEFAULT NULL,
    p_delivery_address JSONB DEFAULT NULL,
    p_payment_reference TEXT DEFAULT NULL,
    p_special_instructions TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_clean_order_type TEXT;
    v_settings RECORD;
    v_item JSONB;
    v_menu_item RECORD;
    v_item_id UUID;
    v_qty INTEGER;
    v_line_total NUMERIC(10,2);
    v_subtotal NUMERIC(10,2) := 0;
    v_delivery_charge NUMERIC(10,2) := 0;
    v_grand_total NUMERIC(10,2) := 0;
    v_advance_pct NUMERIC(5,2) := 0;
    v_advance_amount NUMERIC(10,2) := 0;
    v_cod_amount NUMERIC(10,2) := 0;
    v_payment_status TEXT;
    v_order_status TEXT;
    v_table RECORD;
    v_table_id UUID := NULL;
    v_table_number TEXT := NULL;
    v_zone RECORD;
    v_zone_name TEXT := NULL;
    v_customer_id UUID;
    v_address_id UUID := NULL;
    v_order_id UUID;
    v_order_number TEXT;
    v_tracking_token TEXT;
    v_order_item RECORD;
    v_verified_items JSONB := '[]'::jsonb;
    v_notification_title TEXT;
    v_notification_body TEXT;
BEGIN
    -- Validate Customer Inputs
    IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN
        RAISE EXCEPTION 'Customer name must be at least 2 characters.';
    END IF;

    IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) < 10 THEN
        RAISE EXCEPTION 'A valid 10-digit phone number is required.';
    END IF;

    -- Validate Order Type
    v_clean_order_type := upper(trim(p_order_type));
    IF v_clean_order_type NOT IN ('DINE_IN', 'HOME_DELIVERY') THEN
        RAISE EXCEPTION 'Invalid order type. Must be DINE_IN or HOME_DELIVERY.';
    END IF;

    -- Validate Items Non-Empty
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty. Please select food items.';
    END IF;

    -- Fetch Restaurant Settings
    SELECT * INTO v_settings FROM public.restaurant_settings LIMIT 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Restaurant settings configuration is missing.';
    END IF;

    -- Loop and Re-verify every menu item and its price server-side
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        BEGIN
            v_item_id := (v_item->>'menu_item_id')::uuid;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Invalid menu item identifier.';
        END;

        v_qty := COALESCE((v_item->>'quantity')::int, 0);
        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be at least 1.';
        END IF;

        SELECT id, name, price, is_available
        INTO v_menu_item
        FROM public.menu_items
        WHERE id = v_item_id;

        IF NOT FOUND OR v_menu_item.is_available = false THEN
            RAISE EXCEPTION 'Sorry, "%" is currently unavailable. Please update your cart.', 
                COALESCE(v_menu_item.name, 'Selected dish');
        END IF;

        v_line_total := ROUND(v_menu_item.price * v_qty, 2);
        v_subtotal := v_subtotal + v_line_total;

        -- Store verified snapshot item
        v_verified_items := v_verified_items || jsonb_build_object(
            'menu_item_id', v_menu_item.id,
            'item_name_snapshot', v_menu_item.name,
            'unit_price_snapshot', v_menu_item.price,
            'quantity', v_qty,
            'line_total', v_line_total
        );
    END LOOP;

    -- Order Type Specific Logic
    IF v_clean_order_type = 'DINE_IN' THEN
        IF v_settings.dine_in_enabled = false THEN
            RAISE EXCEPTION 'Dine-in service is currently disabled.';
        END IF;

        IF p_table_token IS NULL OR trim(p_table_token) = '' THEN
            RAISE EXCEPTION 'Invalid or inactive table QR.';
        END IF;

        SELECT id, table_number, is_active
        INTO v_table
        FROM public.tables
        WHERE qr_token = trim(p_table_token) AND is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid or inactive table QR.';
        END IF;

        v_table_id := v_table.id;
        v_table_number := v_table.table_number;
        v_delivery_charge := 0.00;
        v_advance_pct := 0.00;
        v_advance_amount := 0.00;
        v_cod_amount := 0.00;
        v_grand_total := v_subtotal;
        v_payment_status := 'NOT_REQUIRED';
        v_order_status := 'PENDING';

    ELSIF v_clean_order_type = 'HOME_DELIVERY' THEN
        IF v_settings.home_delivery_enabled = false THEN
            RAISE EXCEPTION 'Home delivery service is currently disabled.';
        END IF;

        IF p_delivery_address IS NULL THEN
            RAISE EXCEPTION 'Delivery address is required for home delivery.';
        END IF;

        -- Validate Delivery Zone
        BEGIN
            SELECT id, name, is_active
            INTO v_zone
            FROM public.delivery_zones
            WHERE id = (p_delivery_address->>'delivery_zone_id')::uuid AND is_active = true;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Sorry, home delivery is currently unavailable in this area.';
        END;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Sorry, home delivery is currently unavailable in this area.';
        END IF;

        v_zone_name := v_zone.name;

        -- Address mandatory validation
        IF p_delivery_address->>'address_line' IS NULL OR length(trim(p_delivery_address->>'address_line')) < 3 THEN
            RAISE EXCEPTION 'Complete delivery address line is required.';
        END IF;

        IF p_delivery_address->>'area' IS NULL OR length(trim(p_delivery_address->>'area')) < 2 THEN
            RAISE EXCEPTION 'Delivery area or locality is required.';
        END IF;

        -- Server-side authoritative calculation
        v_delivery_charge := v_settings.delivery_charge;
        v_grand_total := v_subtotal + v_delivery_charge;
        v_advance_pct := v_settings.advance_payment_percentage;
        v_advance_amount := ROUND((v_grand_total * v_advance_pct) / 100.0, 2);
        v_cod_amount := v_grand_total - v_advance_amount;

        -- Check payment reference
        IF p_payment_reference IS NOT NULL AND length(trim(p_payment_reference)) > 3 THEN
            v_payment_status := 'SUBMITTED';
            v_order_status := 'PAYMENT_SUBMITTED';
        ELSE
            v_payment_status := 'PENDING';
            v_order_status := 'AWAITING_PAYMENT';
        END IF;
    END IF;

    -- Generate Collision-Safe Order Number & Secure Tracking Token
    v_order_number := public.generate_order_number();
    v_tracking_token := replace(gen_random_uuid()::text, '-', '');

    -- Create or Link Customer record
    INSERT INTO public.customers (name, phone)
    VALUES (trim(p_customer_name), trim(p_customer_phone))
    RETURNING id INTO v_customer_id;

    -- Create Address record if Home Delivery
    IF v_clean_order_type = 'HOME_DELIVERY' THEN
        INSERT INTO public.customer_addresses (
            customer_id,
            name,
            phone,
            address_line,
            area,
            landmark,
            city,
            pincode,
            delivery_zone_id
        )
        VALUES (
            v_customer_id,
            trim(p_customer_name),
            trim(p_customer_phone),
            trim(p_delivery_address->>'address_line'),
            trim(p_delivery_address->>'area'),
            trim(p_delivery_address->>'landmark'),
            COALESCE(trim(p_delivery_address->>'city'), 'Mecheda'),
            trim(p_delivery_address->>'pincode'),
            v_zone.id
        )
        RETURNING id INTO v_address_id;
    END IF;

    -- Insert Order
    INSERT INTO public.orders (
        order_number,
        order_type,
        customer_id,
        table_id,
        customer_name,
        customer_phone,
        delivery_address_id,
        subtotal,
        delivery_charge,
        grand_total,
        advance_percentage,
        advance_amount,
        cod_amount,
        payment_status,
        order_status,
        payment_reference,
        special_instructions,
        tracking_token
    )
    VALUES (
        v_order_number,
        v_clean_order_type,
        v_customer_id,
        v_table_id,
        trim(p_customer_name),
        trim(p_customer_phone),
        v_address_id,
        v_subtotal,
        v_delivery_charge,
        v_grand_total,
        v_advance_pct,
        v_advance_amount,
        v_cod_amount,
        v_payment_status,
        v_order_status,
        trim(p_payment_reference),
        trim(p_special_instructions),
        v_tracking_token
    )
    RETURNING id INTO v_order_id;

    -- Insert Snapshot Order Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_verified_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            menu_item_id,
            item_name_snapshot,
            unit_price_snapshot,
            quantity,
            line_total
        )
        VALUES (
            v_order_id,
            (v_item->>'menu_item_id')::uuid,
            v_item->>'item_name_snapshot',
            (v_item->>'unit_price_snapshot')::numeric,
            (v_item->>'quantity')::int,
            (v_item->>'line_total')::numeric
        );
    END LOOP;

    -- If Home Delivery with payment reference, create initial payment record
    IF v_clean_order_type = 'HOME_DELIVERY' AND p_payment_reference IS NOT NULL AND length(trim(p_payment_reference)) > 3 THEN
        INSERT INTO public.payments (
            order_id,
            payment_type,
            amount,
            payment_status,
            customer_reference,
            submitted_at
        )
        VALUES (
            v_order_id,
            'PHONEPE_QR_MANUAL',
            v_advance_amount,
            'SUBMITTED',
            trim(p_payment_reference),
            now()
        );
    END IF;

    -- Initial Order Status History
    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        note
    )
    VALUES (
        v_order_id,
        NULL,
        v_order_status,
        CASE 
            WHEN v_clean_order_type = 'DINE_IN' THEN 'Dine-In order placed from Table ' || v_table_number
            WHEN v_payment_status = 'SUBMITTED' THEN 'Delivery order created with advance payment reference submitted'
            ELSE 'Delivery order created, awaiting advance payment submission'
        END
    );

    -- Owner Notification Record (Foundation for STEP 6 Push Notifications)
    IF v_clean_order_type = 'DINE_IN' THEN
        v_notification_title := 'New Dine-In Order: ' || v_order_number;
        v_notification_body := 'Table ' || v_table_number || ' • ' || trim(p_customer_name) || ' • Total: ₹' || v_grand_total;
    ELSE
        v_notification_title := 'New Delivery Order: ' || v_order_number;
        v_notification_body := trim(p_customer_name) || ' (' || v_zone_name || ') • Grand Total: ₹' || v_grand_total || ' • Advance: ₹' || v_advance_amount;
    END IF;

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
        v_order_id,
        v_notification_title,
        v_notification_body,
        'ORDER',
        false
    );

    -- Return full order response
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'tracking_token', v_tracking_token,
        'order_type', v_clean_order_type,
        'subtotal', v_subtotal,
        'delivery_charge', v_delivery_charge,
        'grand_total', v_grand_total,
        'advance_amount', v_advance_amount,
        'cod_amount', v_cod_amount,
        'order_status', v_order_status,
        'payment_status', v_payment_status,
        'table_number', v_table_number,
        'zone_name', v_zone_name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_customer_order(TEXT, TEXT, TEXT, JSONB, TEXT, JSONB, TEXT, TEXT) TO anon, authenticated;

-- 6. Function for submitting PhonePe payment reference
CREATE OR REPLACE FUNCTION public.submit_order_payment(
    p_order_number TEXT,
    p_tracking_token TEXT,
    p_payment_reference TEXT,
    p_payment_amount NUMERIC DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_order RECORD;
    v_amount NUMERIC(10,2);
BEGIN
    IF p_payment_reference IS NULL OR length(trim(p_payment_reference)) < 3 THEN
        RAISE EXCEPTION 'Please provide a valid PhonePe transaction or UTR reference number.';
    END IF;

    -- Securely locate order by BOTH order_number and non-guessable tracking_token
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

    -- Insert payment record
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

    -- Update order status
    UPDATE public.orders
    SET payment_reference = trim(p_payment_reference),
        payment_status = 'SUBMITTED',
        order_status = 'PAYMENT_SUBMITTED',
        updated_at = now()
    WHERE id = v_order.id;

    -- Add to status history
    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        note
    )
    VALUES (
        v_order.id,
        v_order.order_status,
        'PAYMENT_SUBMITTED',
        COALESCE(p_note, 'Customer submitted PhonePe UTR: ' || trim(p_payment_reference))
    );

    -- Owner notification
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
        'Advance Payment Submitted: ' || v_order.order_number,
        'UTR: ' || trim(p_payment_reference) || ' • Amount: ₹' || v_amount || ' • Customer: ' || v_order.customer_name,
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

GRANT EXECUTE ON FUNCTION public.submit_order_payment(TEXT, TEXT, TEXT, NUMERIC, TEXT) TO anon, authenticated;

-- 7. Function for securely fetching order tracking information
CREATE OR REPLACE FUNCTION public.get_customer_order(
    p_order_number TEXT,
    p_tracking_token TEXT
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
    SELECT * INTO v_order
    FROM public.orders
    WHERE order_number = trim(p_order_number)
      AND tracking_token = trim(p_tracking_token);

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
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', h.id,
            'old_status', h.old_status,
            'new_status', h.new_status,
            'note', h.note,
            'created_at', h.created_at
        ) ORDER BY h.created_at ASC
    ), '[]'::jsonb) INTO v_history
    FROM public.order_status_history h
    WHERE h.order_id = v_order.id;

    -- Fetch payment submissions
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'payment_type', p.payment_type,
            'amount', p.amount,
            'payment_status', p.payment_status,
            'customer_reference', p.customer_reference,
            'submitted_at', p.submitted_at,
            'verified_at', p.verified_at
        ) ORDER BY p.created_at DESC
    ), '[]'::jsonb) INTO v_payments
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
            'advance_percentage', v_order.advance_percentage,
            'advance_amount', v_order.advance_amount,
            'cod_amount', v_order.cod_amount,
            'payment_status', v_order.payment_status,
            'order_status', v_order.order_status,
            'payment_reference', v_order.payment_reference,
            'special_instructions', v_order.special_instructions,
            'created_at', v_order.created_at,
            'updated_at', v_order.updated_at,
            'table_number', v_table_number,
            'address', v_address_json
        ),
        'items', COALESCE(v_items, '[]'::jsonb),
        'history', v_history,
        'payments', v_payments
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_order(TEXT, TEXT) TO anon, authenticated;
