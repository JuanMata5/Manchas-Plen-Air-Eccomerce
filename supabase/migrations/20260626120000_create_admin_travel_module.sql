-- Extend the existing travel module without touching products or the checkout tables.
-- travel_experiences remains the source of truth for tour packages.

ALTER TABLE public.travel_experiences
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS full_description TEXT,
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available'
  CHECK (status IN ('available', 'upcoming', 'sold_out', 'finished')),
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS return_date DATE,
ADD COLUMN IF NOT EXISTS duration_days INTEGER,
ADD COLUMN IF NOT EXISTS reservation_deadline DATE,
ADD COLUMN IF NOT EXISTS available_spots INTEGER,
ADD COLUMN IF NOT EXISTS min_spots INTEGER,
ADD COLUMN IF NOT EXISTS max_spots INTEGER,
ADD COLUMN IF NOT EXISTS price_total NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS price_reservation NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS'
  CHECK (currency IN ('ARS', 'USD')),
ADD COLUMN IF NOT EXISTS show_both_prices BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS includes JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS excludes JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS packing_list JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recommendations TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS expected_weather TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_slug TEXT,
ADD COLUMN IF NOT EXISTS share_image_url TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_option TEXT NOT NULL DEFAULT 'full',
ADD COLUMN IF NOT EXISTS amount_paid_ars NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS balance_due_ars NUMERIC(12,2);

UPDATE public.travel_experiences
SET
  slug = COALESCE(slug, id),
  destination = COALESCE(destination, location),
  available_spots = COALESCE(available_spots, capacity),
  max_spots = COALESCE(max_spots, capacity),
  short_description = COALESCE(short_description, LEFT(description, 180)),
  full_description = COALESCE(full_description, description)
WHERE slug IS NULL
   OR destination IS NULL
   OR available_spots IS NULL
   OR max_spots IS NULL
   OR short_description IS NULL
   OR full_description IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_travel_experiences_slug_unique
  ON public.travel_experiences(slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_travel_experiences_status
  ON public.travel_experiences(status);

CREATE INDEX IF NOT EXISTS idx_travel_experiences_departure_date
  ON public.travel_experiences(departure_date);

ALTER TABLE public.travel_bookings
ADD COLUMN IF NOT EXISTS passenger_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS price_total NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS price_reservation NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS balance_due NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS'
  CHECK (currency IN ('ARS', 'USD')),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS reservation_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (reservation_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'full'
  CHECK (payment_mode IN ('full', 'reservation'));

CREATE INDEX IF NOT EXISTS idx_travel_bookings_reservation_status
  ON public.travel_bookings(reservation_status);

CREATE INDEX IF NOT EXISTS idx_travel_bookings_payment_status
  ON public.travel_bookings(payment_status);
