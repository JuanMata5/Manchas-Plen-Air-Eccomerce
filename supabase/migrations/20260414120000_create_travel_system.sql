-- Create travel experiences table
CREATE TABLE IF NOT EXISTS public.travel_experiences (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  dates TEXT NOT NULL,
  description TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  image_url TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create travel bookings table
CREATE TABLE IF NOT EXISTS public.travel_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_id TEXT NOT NULL REFERENCES public.travel_experiences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_price_usd INTEGER NOT NULL,
  plan_variant TEXT,
  booking_reference TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed',
  payment_status TEXT DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.travel_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for travel_experiences (public read)
CREATE POLICY "travel_experiences_public_read" ON public.travel_experiences
  FOR SELECT USING (is_active = TRUE);

-- Policies for travel_bookings (own bookings)
CREATE POLICY "travel_bookings_user_read" ON public.travel_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "travel_bookings_admin_all" ON public.travel_bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_travel_experiences_active ON public.travel_experiences(is_active);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_user ON public.travel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_reference ON public.travel_bookings(booking_reference);

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    ref := 'TRV-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM travel_bookings WHERE booking_reference = ref) INTO exists_check;
    IF NOT exists_check THEN
      RETURN ref;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER trg_travel_experiences_updated_at
  BEFORE UPDATE ON public.travel_experiences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_travel_bookings_updated_at
  BEFORE UPDATE ON public.travel_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();