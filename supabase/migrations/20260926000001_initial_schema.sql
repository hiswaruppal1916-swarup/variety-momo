-- Variety Momo Initial Database Schema Migration
-- Generated for Supabase & Postgres

-- ============================================================================
-- 1. EXTENSIONS & BASE HELPERS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. RESTAURANT SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name TEXT NOT NULL DEFAULT 'Variety Momo',
    phone TEXT NOT NULL DEFAULT '7827423777',
    address TEXT NOT NULL DEFAULT 'Near Mecheda Railway Station Road',
    city TEXT NOT NULL DEFAULT 'Mecheda',
    state TEXT NOT NULL DEFAULT 'West Bengal',
    country TEXT NOT NULL DEFAULT 'India',
    logo_url TEXT DEFAULT '/variety-momo-logo.jpg',
    favicon_url TEXT DEFAULT '/favicon.png',
    phonepe_upi_id TEXT DEFAULT '7827423777@ybl',
    phonepe_qr_url TEXT,
    delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 50 CHECK (delivery_charge >= 0),
    home_delivery_enabled BOOLEAN NOT NULL DEFAULT true,
    dine_in_enabled BOOLEAN NOT NULL DEFAULT true,
    advance_payment_percentage NUMERIC(5,2) NOT NULL DEFAULT 30 CHECK (advance_payment_percentage >= 0 AND advance_payment_percentage <= 100),
    cod_percentage NUMERIC(5,2) NOT NULL DEFAULT 70 CHECK (cod_percentage >= 0 AND cod_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_percentage_total CHECK (advance_payment_percentage + cod_percentage = 100)
);

CREATE TRIGGER set_restaurant_settings_updated_at
BEFORE UPDATE ON public.restaurant_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3. PROFILES TABLE (OWNER AUTH & ROLE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Owner validation helper function
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'OWNER'
      AND is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

-- ============================================================================
-- 4. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. MENU ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_vegetarian BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. TABLES (DINE-IN)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number TEXT NOT NULL UNIQUE,
    qr_token TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_tables_updated_at
BEFORE UPDATE ON public.tables
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 7. DELIVERY ZONES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 8. CUSTOMERS & ADDRESSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line TEXT NOT NULL,
    area TEXT NOT NULL,
    landmark TEXT,
    city TEXT NOT NULL DEFAULT 'Mecheda',
    pincode TEXT,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    delivery_zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 9. ORDERS & ORDER ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    order_type TEXT NOT NULL CHECK (order_type IN ('DINE_IN', 'HOME_DELIVERY')),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address_id UUID REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (delivery_charge >= 0),
    grand_total NUMERIC(10,2) NOT NULL CHECK (grand_total >= 0),
    advance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (advance_percentage >= 0 AND advance_percentage <= 100),
    advance_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (advance_amount >= 0),
    cod_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cod_amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('NOT_REQUIRED', 'PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'REFUNDED')),
    order_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'AWAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED', 'REJECTED')),
    payment_reference TEXT,
    special_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_dine_in_charges CHECK (
        order_type != 'DINE_IN' OR (
            delivery_charge = 0 AND 
            advance_amount = 0 AND 
            cod_amount = 0 AND 
            payment_status = 'NOT_REQUIRED'
        )
    ),
    CONSTRAINT check_home_delivery_totals CHECK (
        order_type != 'HOME_DELIVERY' OR (
            grand_total = subtotal + delivery_charge AND
            advance_amount + cod_amount = grand_total
        )
    )
);

CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name_snapshot TEXT NOT NULL,
    unit_price_snapshot NUMERIC(10,2) NOT NULL CHECK (unit_price_snapshot >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 10. PAYMENTS & VERIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL DEFAULT 'PHONEPE_QR_MANUAL' CHECK (payment_type IN ('PHONEPE_QR_MANUAL')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED')),
    customer_reference TEXT,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.payment_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 11. ORDER STATUS HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 12. PUSH SUBSCRIPTIONS & NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type TEXT NOT NULL CHECK (user_type IN ('OWNER', 'CUSTOMER')),
    user_id UUID,
    device_id TEXT,
    fcm_token TEXT NOT NULL,
    platform TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('OWNER', 'CUSTOMER')),
    recipient_id UUID,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'ORDER',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 13. OFFERS, GALLERY & REVIEWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE',
    discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    badge TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_gallery_updated_at
BEFORE UPDATE ON public.gallery
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 14. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);

CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_slug ON public.menu_items(slug);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON public.order_items(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON public.payments(payment_status);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

-- ============================================================================
-- 15. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 15.1 restaurant_settings policies
CREATE POLICY "Public Read Restaurant Settings"
ON public.restaurant_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Owner Update Restaurant Settings"
ON public.restaurant_settings FOR UPDATE
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Owner Insert Restaurant Settings"
ON public.restaurant_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_owner());

-- 15.2 profiles policies
CREATE POLICY "Profiles Read Self or Owner"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_owner());

CREATE POLICY "Profiles Update Self Owner"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid() AND public.is_owner())
WITH CHECK (id = auth.uid() AND public.is_owner());

-- 15.3 categories policies
CREATE POLICY "Public Read Active Categories"
ON public.categories FOR SELECT
TO public
USING (is_active = true OR public.is_owner());

CREATE POLICY "Owner Manage Categories"
ON public.categories FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.4 menu_items policies
CREATE POLICY "Public Read Available Menu Items"
ON public.menu_items FOR SELECT
TO public
USING (is_available = true OR public.is_owner());

CREATE POLICY "Owner Manage Menu Items"
ON public.menu_items FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.5 tables policies
CREATE POLICY "Public Read Active Tables"
ON public.tables FOR SELECT
TO public
USING (is_active = true OR public.is_owner());

CREATE POLICY "Owner Manage Tables"
ON public.tables FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.6 delivery_zones policies
CREATE POLICY "Public Read Active Delivery Zones"
ON public.delivery_zones FOR SELECT
TO public
USING (is_active = true OR public.is_owner());

CREATE POLICY "Owner Manage Delivery Zones"
ON public.delivery_zones FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.7 customers policies
CREATE POLICY "Owner Read Customers"
ON public.customers FOR SELECT
TO authenticated
USING (public.is_owner());

CREATE POLICY "Public Insert Customers"
ON public.customers FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Owner Update Customers"
ON public.customers FOR UPDATE
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.8 customer_addresses policies
CREATE POLICY "Owner Read Customer Addresses"
ON public.customer_addresses FOR SELECT
TO authenticated
USING (public.is_owner());

CREATE POLICY "Public Insert Customer Addresses"
ON public.customer_addresses FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Owner Manage Customer Addresses"
ON public.customer_addresses FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.9 orders policies
CREATE POLICY "Owner Read All Orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.is_owner());

CREATE POLICY "Public Insert Orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Owner Manage Orders"
ON public.orders FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.10 order_items policies
CREATE POLICY "Owner Read Order Items"
ON public.order_items FOR SELECT
TO authenticated
USING (public.is_owner());

CREATE POLICY "Public Insert Order Items"
ON public.order_items FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Owner Manage Order Items"
ON public.order_items FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.11 payments policies
CREATE POLICY "Owner Read Payments"
ON public.payments FOR SELECT
TO authenticated
USING (public.is_owner());

CREATE POLICY "Public Insert Payments"
ON public.payments FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Owner Manage Payments"
ON public.payments FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.12 payment_verifications policies
CREATE POLICY "Owner Manage Payment Verifications"
ON public.payment_verifications FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.13 order_status_history policies
CREATE POLICY "Owner Manage Status History"
ON public.order_status_history FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.14 push_subscriptions policies
CREATE POLICY "Owner Read Push Subscriptions"
ON public.push_subscriptions FOR SELECT
TO authenticated
USING (public.is_owner());

CREATE POLICY "Public Insert Push Subscriptions"
ON public.push_subscriptions FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Owner Manage Push Subscriptions"
ON public.push_subscriptions FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.15 notifications policies
CREATE POLICY "Owner Read Notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (public.is_owner());

CREATE POLICY "Owner Manage Notifications"
ON public.notifications FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.16 offers policies
CREATE POLICY "Public Read Active Offers"
ON public.offers FOR SELECT
TO public
USING (is_active = true OR public.is_owner());

CREATE POLICY "Owner Manage Offers"
ON public.offers FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.17 gallery policies
CREATE POLICY "Public Read Active Gallery"
ON public.gallery FOR SELECT
TO public
USING (is_active = true OR public.is_owner());

CREATE POLICY "Owner Manage Gallery"
ON public.gallery FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 15.18 reviews policies
CREATE POLICY "Public Read Approved Reviews"
ON public.reviews FOR SELECT
TO public
USING (is_approved = true OR public.is_owner());

CREATE POLICY "Public Submit Review"
ON public.reviews FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Owner Manage Reviews"
ON public.reviews FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- ============================================================================
-- 16. STORAGE BUCKETS CONFIGURATION
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('restaurant-assets', 'restaurant-assets', true),
  ('menu-images', 'menu-images', true),
  ('gallery-images', 'gallery-images', true),
  ('offer-images', 'offer-images', true),
  ('payment-assets', 'payment-assets', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage RLS
CREATE POLICY "Public Read Public Buckets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('restaurant-assets', 'menu-images', 'gallery-images', 'offer-images'));

CREATE POLICY "Owner Manage Public Buckets"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id IN ('restaurant-assets', 'menu-images', 'gallery-images', 'offer-images') AND public.is_owner())
WITH CHECK (bucket_id IN ('restaurant-assets', 'menu-images', 'gallery-images', 'offer-images') AND public.is_owner());

CREATE POLICY "Owner Manage Payment Assets"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payment-assets' AND public.is_owner())
WITH CHECK (bucket_id = 'payment-assets' AND public.is_owner());

CREATE POLICY "Customer Upload Payment Screenshots"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-assets' AND (storage.foldername(name))[1] = 'customer-payments');

-- ============================================================================
-- 17. REALTIME SETUP
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================================
-- 18. INITIAL SEED DATA
-- ============================================================================
-- Restaurant settings seed
INSERT INTO public.restaurant_settings (
    restaurant_name,
    phone,
    address,
    city,
    state,
    country,
    logo_url,
    favicon_url,
    phonepe_upi_id,
    delivery_charge,
    home_delivery_enabled,
    dine_in_enabled,
    advance_payment_percentage,
    cod_percentage
)
SELECT 
    'Variety Momo',
    '7827423777',
    'Near Mecheda Railway Station Road',
    'Mecheda',
    'West Bengal',
    'India',
    '/variety-momo-logo.jpg',
    '/favicon.png',
    '7827423777@ybl',
    50,
    true,
    true,
    30,
    70
WHERE NOT EXISTS (SELECT 1 FROM public.restaurant_settings LIMIT 1);

-- Default Delivery Zones for Mecheda
INSERT INTO public.delivery_zones (name, description, is_active)
VALUES
  ('Mecheda Station & Bazaar Hub', 'Within 2.5 km of Mecheda Railway Station Road', true),
  ('Kolaghat Bridge Approach', 'Kolaghat crossing & NH116 junction areas', true),
  ('Mecheda College Road', 'College road residential and commercial belt', true)
ON CONFLICT DO NOTHING;

-- Default Dine-In Tables
INSERT INTO public.tables (table_number, qr_token, is_active)
VALUES
  ('T-01', 'tbl_momo_01_sec82', true),
  ('T-02', 'tbl_momo_02_k73ea', true),
  ('T-03', 'tbl_momo_03_9a22f', true),
  ('T-04', 'tbl_momo_04_b14dc', true),
  ('T-05', 'tbl_momo_05_c8891', true),
  ('T-06', 'tbl_momo_06_e33fa', true)
ON CONFLICT DO NOTHING;
