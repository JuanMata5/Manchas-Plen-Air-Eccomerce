-- ==========================================================
-- Plen Air - Schema completo
-- ==========================================================

-- -------------------------------------------------------
-- EXTENSIONES
-- -------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------
-- CATEGORIAS DE PRODUCTOS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- PRODUCTOS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  price_ars        NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_usd        NUMERIC(10,2),
  stock            INT  NOT NULL DEFAULT 0,
  max_per_order    INT  NOT NULL DEFAULT 10,
  image_url        TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  product_type     TEXT NOT NULL DEFAULT 'merchandise'
                   CHECK (product_type IN ('ticket','workshop','merchandise')),
  event_date       DATE,
  event_location   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- PERFILES DE USUARIO (extiende auth.users)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name  TEXT,
  phone      TEXT,
  dni        TEXT,
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- ORDENES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- datos del comprador (para órdenes de invitados)
  buyer_email         TEXT NOT NULL,
  buyer_name          TEXT NOT NULL,
  buyer_phone         TEXT,
  buyer_dni           TEXT,
  -- totales
  subtotal_ars        NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_ars        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ars           NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- estado
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','payment_pending','paid','cancelled','refunded')),
  payment_method      TEXT CHECK (payment_method IN ('mercadopago','transfer')),
  payment_ref         TEXT,           -- MP preference_id o referencia transfer
  mp_payment_id       TEXT,           -- ID de pago confirmado MP
  transfer_ref        TEXT,           -- código único para transferencia
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- ITEMS DE ORDEN
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_snapshot JSONB NOT NULL,   -- copia del producto al momento de la compra
  quantity    INT  NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- TICKETS (generados tras pago confirmado)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  holder_name TEXT NOT NULL,
  holder_email TEXT NOT NULL,
  holder_dni  TEXT,
  qr_code     TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_used     BOOLEAN NOT NULL DEFAULT FALSE,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- CUPONES DE DESCUENTO
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  description     TEXT,
  discount_type   TEXT NOT NULL DEFAULT 'percentage'
                  CHECK (discount_type IN ('percentage','fixed')),
  discount_value  NUMERIC(10,2) NOT NULL,
  min_order_ars   NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_uses        INT,
  uses_count      INT NOT NULL DEFAULT 0,
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- WEBHOOK LOGS (para debug de MP)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source     TEXT NOT NULL,
  payload    JSONB,
  processed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- UPDATED_AT TRIGGER
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------
-- TRIGGER: auto-crear perfil al registrarse
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------

-- categories: lectura pública, escritura solo admin (service role)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (TRUE);

-- products: lectura pública de activos, escritura solo admin
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (is_active = TRUE);

-- profiles: el usuario ve/edita solo su perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- orders: el usuario ve sus propias órdenes
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (TRUE); -- cualquiera puede crear (guest checkout)

-- order_items: legible si el usuario es dueño de la orden
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR auth.uid() IS NULL)
  ));
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (TRUE);

-- tickets: el titular puede ver su ticket
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets_select_own" ON public.tickets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()
  ));

-- coupons: lectura pública para validar código
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_public_read" ON public.coupons FOR SELECT USING (is_active = TRUE);

-- webhook_logs: solo service role
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- DATOS SEMILLA
-- -------------------------------------------------------

INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Tickets de Entrada',  'tickets',    1),
  ('Talleres',            'talleres',   2),
  ('Merchandising',       'merch',      3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
  category_id, name, slug, description,
  price_ars, price_usd, stock, max_per_order,
  is_active, is_featured, product_type, event_date, event_location
) VALUES
(
  (SELECT id FROM public.categories WHERE slug = 'tickets'),
  'Entrada General - Plen Air 2025',
  'entrada-general-2025',
  'Acceso completo a la convención Plen Air 2025. Dos días de arte, naturaleza y comunidad creativa en el exterior.',
  15000, 15, 200, 5,
  TRUE, TRUE, 'ticket', '2025-11-15', 'Parque Los Andes, Buenos Aires'
),
(
  (SELECT id FROM public.categories WHERE slug = 'tickets'),
  'Entrada VIP - Plen Air 2025',
  'entrada-vip-2025',
  'Acceso VIP con kit de bienvenida, área exclusiva y masterclass privada con artistas invitados.',
  35000, 35, 50, 2,
  TRUE, TRUE, 'ticket', '2025-11-15', 'Parque Los Andes, Buenos Aires'
),
(
  (SELECT id FROM public.categories WHERE slug = 'talleres'),
  'Taller: Acuarela al Aire Libre',
  'taller-acuarela-2025',
  'Taller intensivo de 4 horas de acuarela en plein air. Incluye materiales básicos. Cupos limitados.',
  20000, 20, 20, 1,
  TRUE, FALSE, 'workshop', '2025-11-16', 'Parque Los Andes, Buenos Aires'
),
(
  (SELECT id FROM public.categories WHERE slug = 'talleres'),
  'Taller: Óleo y Paisaje Urbano',
  'taller-oleo-2025',
  'Técnicas de óleo para paisaje urbano con artista invitado internacional. Materiales no incluidos.',
  25000, 25, 15, 1,
  TRUE, FALSE, 'workshop', '2025-11-16', 'Parque Los Andes, Buenos Aires'
),
(
  (SELECT id FROM public.categories WHERE slug = 'merch'),
  'Remera Plen Air 2025',
  'remera-plen-air-2025',
  'Remera 100% algodón con diseño exclusivo de la edición 2025. Tallas S-M-L-XL.',
  8000, 8, 100, 5,
  TRUE, FALSE, 'merchandise', NULL, NULL
),
(
  (SELECT id FROM public.categories WHERE slug = 'merch'),
  'Bolso de Tela Artista',
  'bolso-artista-2025',
  'Bolso de tela resistente con bolsillos internos para materiales de pintura. Diseño plein air.',
  6500, 7, 80, 3,
  TRUE, FALSE, 'merchandise', NULL, NULL
)
ON CONFLICT (slug) DO NOTHING;

-- Cupón de ejemplo
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_ars, max_uses, valid_until, is_active)
VALUES ('BIENVENIDA20', '20% de descuento para nuevos usuarios', 'percentage', 20, 10000, 100, '2025-12-31', TRUE)
ON CONFLICT (code) DO NOTHING;
