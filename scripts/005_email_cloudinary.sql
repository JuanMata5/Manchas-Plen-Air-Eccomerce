-- ==========================================================
-- Migración: Email Queue + Cloudinary Images
-- ==========================================================

-- Email Queue Table
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

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(sent_at, attempts);

-- Product Images Table (para Cloudinary)
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

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images(product_id, is_primary);

-- Enable RLS for new tables
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- email_queue: solo service role
CREATE POLICY "email_queue_service_only" ON public.email_queue FOR ALL USING (FALSE);

-- product_images: lectura pública de imágenes de productos activos
CREATE POLICY "product_images_public_read" ON public.product_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active = TRUE
  ));
