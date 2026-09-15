-- Ensure the production database has every column used by the travel admin
-- form and the travel checkout. Safe to run more than once.

ALTER TABLE public.travel_experiences
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS destination TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS departure_date DATE,
  ADD COLUMN IF NOT EXISTS return_date DATE,
  ADD COLUMN IF NOT EXISTS duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS reservation_deadline DATE,
  ADD COLUMN IF NOT EXISTS available_spots INTEGER,
  ADD COLUMN IF NOT EXISTS min_spots INTEGER,
  ADD COLUMN IF NOT EXISTS max_spots INTEGER,
  ADD COLUMN IF NOT EXISTS price_total NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS price_reservation NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS show_both_prices BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS itinerary JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS includes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS excludes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS packing_list JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recommendations TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS expected_weather TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_slug TEXT,
  ADD COLUMN IF NOT EXISTS share_image_url TEXT,
  ADD COLUMN IF NOT EXISTS option_groups JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_modes JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.travel_bookings
  ADD COLUMN IF NOT EXISTS order_id UUID,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS dates TEXT,
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS price_ars_blue NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS passenger_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS price_total NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS price_reservation NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS reservation_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS qr_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS balance_payment_order_id UUID,
  ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_payment_mode TEXT,
  ADD COLUMN IF NOT EXISTS payment_installments INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS options_price_modifier NUMERIC(10, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_travel_experiences_slug
  ON public.travel_experiences(slug);

CREATE INDEX IF NOT EXISTS idx_travel_bookings_order
  ON public.travel_bookings(order_id);

CREATE INDEX IF NOT EXISTS idx_travel_bookings_payment_mode
  ON public.travel_bookings(selected_payment_mode);

CREATE UNIQUE INDEX IF NOT EXISTS idx_travel_bookings_qr_token
  ON public.travel_bookings(qr_token)
  WHERE qr_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_travel_bookings_balance_payment_order
  ON public.travel_bookings(balance_payment_order_id);

UPDATE public.travel_experiences
SET
  destination = COALESCE(destination, location),
  available_spots = COALESCE(available_spots, capacity),
  max_spots = COALESCE(max_spots, capacity),
  short_description = COALESCE(short_description, LEFT(description, 180)),
  full_description = COALESCE(full_description, description),
  option_groups = COALESCE(option_groups, '[]'::jsonb),
  payment_modes = COALESCE(payment_modes, '[]'::jsonb)
WHERE destination IS NULL
   OR available_spots IS NULL
   OR max_spots IS NULL
   OR short_description IS NULL
   OR full_description IS NULL
   OR option_groups IS NULL
   OR payment_modes IS NULL;

UPDATE public.travel_bookings
SET
  passenger_count = COALESCE(passenger_count, 1),
  payment_installments = COALESCE(payment_installments, 1),
  options_price_modifier = COALESCE(options_price_modifier, 0),
  selected_options = COALESCE(selected_options, '{}'::jsonb)
WHERE passenger_count IS NULL
   OR payment_installments IS NULL
   OR options_price_modifier IS NULL
   OR selected_options IS NULL;