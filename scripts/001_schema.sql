
-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Opcional: Limpiar base de datos (solo para desarrollo)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

---------------------------------------
-- 1. Tabla de Usuarios (Auth)
---------------------------------------
-- Supabase maneja su propio esquema `auth` con la tabla `users`.
-- Columnas relevantes: id (UUID), email, raw_user_meta_data (JSONB)
-- `raw_user_meta_data` se usa para guardar datos extra como nombre, dni, etc.


---------------------------------------
-- 2. Tabla de Categorías de Productos
---------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


---------------------------------------
-- 3. Tabla de Productos
---------------------------------------
CREATE TYPE product_type AS ENUM ('ticket', 'workshop', 'physical', 'digital');

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id INTEGER REFERENCES public.categories(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price_ars NUMERIC(10, 2) NOT NULL,
  price_usd NUMERIC(10, 2),
  stock INTEGER NOT NULL DEFAULT 0,
  max_per_order INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  image_url VARCHAR(255),
  product_type product_type NOT NULL DEFAULT 'ticket',
  event_date TIMESTAMPTZ, -- Para tickets o workshops
  event_location VARCHAR(255), -- Para tickets o workshops
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


---------------------------------------
-- 4. Tabla de Órdenes
---------------------------------------
CREATE TYPE order_status AS ENUM (
  'pending_payment', -- Esperando pago
  'paid',            -- Pagado
  'cancelled',       -- Cancelado
  'refunded',        -- Reembolsado
  'payment_failed'   -- Pago fallido
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending_payment',
  total_ars NUMERIC(10, 2) NOT NULL,
  total_usd NUMERIC(10, 2),
  subtotal_ars NUMERIC(10, 2),
  discount_ars NUMERIC(10, 2),
  payment_method VARCHAR(50), -- e.g., 'mercadopago', 'transfer'
  payment_id VARCHAR(255),   -- ID de la transacción externa (e.g., MercadoPago)
  buyer_name VARCHAR(255),
  buyer_email VARCHAR(255),
  buyer_dni VARCHAR(50),
  bank_transfer_ref VARCHAR(16) UNIQUE, -- Referencia para transferencia
  receipt_url VARCHAR(255), -- URL a comprobante de transferencia
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generar referencia única para transferencias
CREATE OR REPLACE FUNCTION generate_transfer_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bank_transfer_ref := UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_order
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_transfer_ref();

---------------------------------------
-- 5. Tabla de Items de la Orden
---------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price_ars NUMERIC(10, 2) NOT NULL,
  unit_price_usd NUMERIC(10, 2),
  -- Snapshot de datos del producto
  product_name VARCHAR(255),
  product_description TEXT
);

---------------------------------------
-- 6. Tabla de Tickets generados
---------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES public.products(id),
  qr_code_url VARCHAR(255), -- URL a la imagen del QR
  ticket_code VARCHAR(255) NOT NULL UNIQUE, -- El codigo a escanear
  is_validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------
-- 7. Tabla de Cupones
---------------------------------------
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_ars');

CREATE TABLE IF NOT EXISTS public.coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type discount_type NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    min_spend_ars NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders
ADD COLUMN coupon_id INTEGER REFERENCES public.coupons(id);


---------------------------------------
-- VISTAS (VIEWS)
---------------------------------------
-- Vista para facilitar consulta de órdenes con datos de usuario
CREATE OR REPLACE VIEW public.orders_with_users AS
  SELECT
    o.*,
    u.email AS user_email,
    u.raw_user_meta_data->>'full_name' AS user_full_name
  FROM public.orders o
  LEFT JOIN auth.users u ON o.user_id = u.id;


---------------------------------------
-- DATOS INICIALES (SEEDING)
---------------------------------------
-- Solo correr en un entorno limpio para evitar duplicados

-- 1. Insertar Categorías
INSERT INTO public.categories (name, slug, description) VALUES
  ('Entradas', 'entradas', 'Entradas para eventos y convenciones.'),
  ('Talleres', 'talleres', 'Workshops y clases magistrales.'),
  ('Merchandising', 'merchandising', 'Productos oficiales del evento.'),
  ('Digital', 'digital', 'Productos y contenido digital.')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insertar Productos
-- Borrar productos existentes para evitar conflictos de slug
-- Asegurarse que esto solo se corra en desarrollo
DELETE FROM public.products WHERE slug IN (
    'entrada-general-1-dia',
    'entrada-general-3-dias',
    'pase-basico-3-dias',
    'entrada-vip-3-dias',
    'streaming-evento-completo'
);

INSERT INTO public.products (
  category_id, name, slug, description,
  price_ars, price_usd, stock, max_per_order,
  is_active, is_featured, product_type, event_date, event_location
) VALUES
-- Producto 1: Entrada General · 1 Día
(
  (SELECT id FROM public.categories WHERE slug = 'entradas'),
  'Entrada General · 1 Día',
  'entrada-general-1-dia',
  'Acceso general para un día al evento. Elige el día que prefieras al validar tu entrada.',
  8000.00, 8.00, 500, 10,
  TRUE, TRUE, 'ticket', '2026-05-01', 'Av. Sarmiento 1875, C.O.M.'
),
-- Producto 2: Entrada General · 3 Días
(
  (SELECT id FROM public.categories WHERE slug = 'entradas'),
  'Entrada General · 3 Días',
  'entrada-general-3-dias',
  'Acceso general para los tres días del evento.',
  16000.00, 16.00, 500, 10,
  TRUE, TRUE, 'ticket', '2026-05-01', 'Av. Sarmiento 1875, C.O.M.'
),
-- Producto 3: Pase Básico (3 días)
(
  (SELECT id FROM public.categories WHERE slug = 'entradas'),
  'Pase Básico (3 días)',
  'pase-basico-3-dias',
  'Acceso completo para los 3 días de la convención, con acceso a todas las charlas y demos.',
  55000.00, 55.00, 200, 5,
  TRUE, TRUE, 'ticket', '2026-05-01', 'Av. Sarmiento 1875, C.O.M.'
),
-- Producto 4: VIP · 3 Días
(
  (SELECT id FROM public.categories WHERE slug = 'entradas'),
  'VIP · 3 Días',
  'entrada-vip-3-dias',
  'Acceso VIP para los 3 días. Incluye kit de bienvenida, acceso a zona VIP y meet & greet con artistas.',
  75000.00, 75.00, 100, 2,
  TRUE, TRUE, 'ticket', '2026-05-01', 'Av. Sarmiento 1875, C.O.M.'
),
-- Producto 5: Streaming
(
  (SELECT id FROM public.categories WHERE slug = 'digital'),
  'Streaming',
  'streaming-evento-completo',
  'Acceso a la transmisión en vivo de todo el evento. Charlas, demos y contenido exclusivo online.',
  24000.00, 24.00, 1000, 1,
  TRUE, TRUE, 'digital', '2026-05-01', 'Online'
);

-- 3. Insertar Cupones
INSERT INTO public.coupons (code, description, discount_type, discount_value, is_active) VALUES
  ('BIENVENIDO10', '10% de descuento para nuevos clientes', 'percentage', 10, TRUE)
ON CONFLICT (code) DO UPDATE SET 
  description = EXCLUDED.description,
  discount_value = EXCLUDED.discount_value;

INSERT INTO public.coupons (code, description, discount_type, discount_value, is_active, max_uses, min_spend_ars) VALUES
  ('LANZAMIENTO20', '20% de descuento por lanzamiento (primeros 100)', 'percentage', 20, TRUE, 100, 10000)
ON CONFLICT (code) DO UPDATE SET 
  description = EXCLUDED.description,
  discount_value = EXCLUDED.discount_value,
  max_uses = EXCLUDED.max_uses,
  min_spend_ars = EXCLUDED.min_spend_ars;

