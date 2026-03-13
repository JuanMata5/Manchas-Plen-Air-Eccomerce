-- ==========================================================
-- SCRIPT COMBINADO: Crear todas las tablas en orden correcto
-- ==========================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLAS (en orden de dependencias)

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_ars NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_usd NUMERIC(10,2),
  stock INT NOT NULL DEFAULT 0,
  max_per_order INT NOT NULL DEFAULT 10,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  product_type TEXT NOT NULL DEFAULT 'merchandise' CHECK (product_type IN ('ticket','workshop','merchandise')),
  event_date DATE,
  event_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  dni TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT,
  buyer_dni TEXT,
  subtotal_ars NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_ars NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ars NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','payment_pending','paid','cancelled','refunded')),
  payment_method TEXT CHECK (payment_method IN ('mercadopago','transfer')),
  payment_ref TEXT,
  mp_payment_id TEXT,
  transfer_ref TEXT,
  bank_transfer_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_snapshot JSONB NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_ars NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  holder_name TEXT NOT NULL,
  holder_email TEXT NOT NULL,
  holder_dni TEXT,
  qr_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  provider TEXT,
  event_type TEXT,
  payload JSONB,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_data JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  width INT,
  height INT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON public.tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(sent_at, attempts);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

-- 4. FUNCIONES

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', NULL), COALESCE(NEW.raw_user_meta_data->>'last_name', NULL))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE products SET stock = GREATEST(0, stock - p_quantity) WHERE id = p_product_id; END; $$;

CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE coupons SET used_count = used_count + 1 WHERE id = p_coupon_id; END; $$;

GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_coupon_usage(UUID) TO anon, authenticated, service_role;

-- 5. TRIGGERS
CREATE OR REPLACE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (drop first to avoid conflicts)
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
DROP POLICY IF EXISTS "tickets_select_own" ON public.tickets;
DROP POLICY IF EXISTS "coupons_public_read" ON public.coupons;
DROP POLICY IF EXISTS "product_images_public_read" ON public.product_images;

CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR auth.uid() IS NULL)));
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "tickets_select_own" ON public.tickets FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "coupons_public_read" ON public.coupons FOR SELECT USING (is_active = TRUE);
CREATE POLICY "product_images_public_read" ON public.product_images FOR SELECT USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active = TRUE));

-- 7. DATOS SEMILLA
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Tickets de Entrada', 'tickets', 1),
  ('Talleres', 'talleres', 2),
  ('Merchandising', 'merch', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, name, slug, description, price_ars, price_usd, stock, max_per_order, is_active, is_featured, product_type, event_date, event_location) VALUES
((SELECT id FROM categories WHERE slug='tickets'), 'Entrada General - Plen Air 2025', 'entrada-general-2025', 'Acceso completo a la convención Plen Air 2025.', 15000, 15, 200, 5, TRUE, TRUE, 'ticket', '2025-11-15', 'Parque Los Andes, Buenos Aires'),
((SELECT id FROM categories WHERE slug='tickets'), 'Entrada VIP - Plen Air 2025', 'entrada-vip-2025', 'Acceso VIP con kit de bienvenida y masterclass privada.', 35000, 35, 50, 2, TRUE, TRUE, 'ticket', '2025-11-15', 'Parque Los Andes, Buenos Aires'),
((SELECT id FROM categories WHERE slug='talleres'), 'Taller: Acuarela al Aire Libre', 'taller-acuarela-2025', 'Taller intensivo de 4 horas. Incluye materiales.', 20000, 20, 20, 1, TRUE, FALSE, 'workshop', '2025-11-16', 'Parque Los Andes, Buenos Aires'),
((SELECT id FROM categories WHERE slug='merch'), 'Remera Plen Air 2025', 'remera-plen-air-2025', 'Remera 100% algodón con diseño exclusivo.', 8000, 8, 100, 5, TRUE, FALSE, 'merchandise', NULL, NULL),
((SELECT id FROM categories WHERE slug='merch'), 'Bolso de Tela Artista', 'bolso-artista-2025', 'Bolso de tela con bolsillos para materiales.', 6500, 7, 80, 3, TRUE, FALSE, 'merchandise', NULL, NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_ars, max_uses, valid_until, is_active)
VALUES ('BIENVENIDA20', '20% de descuento', 'percentage', 20, 10000, 100, '2025-12-31', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 8. ADMIN USER
INSERT INTO profiles (id, is_admin)
SELECT id, true FROM auth.users
WHERE email = 'jujuusmata@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true;
