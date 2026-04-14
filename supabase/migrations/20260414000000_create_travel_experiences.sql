-- Create travel_experiences table
CREATE TABLE IF NOT EXISTS travel_experiences (
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

-- Create travel_bookings table
CREATE TABLE IF NOT EXISTS travel_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_id TEXT NOT NULL REFERENCES travel_experiences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_name TEXT NOT NULL,
  plan_price_usd DECIMAL(10, 2) NOT NULL,
  plan_variant TEXT,
  booking_reference TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed',
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE travel_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for travel_experiences (public read)
DROP POLICY IF EXISTS "travel_experiences_public_read" ON travel_experiences;
CREATE POLICY "travel_experiences_public_read" ON travel_experiences
  FOR SELECT USING (is_active = TRUE);

-- Policies for travel_bookings (own read)
DROP POLICY IF EXISTS "travel_bookings_user_read" ON travel_bookings;
CREATE POLICY "travel_bookings_user_read" ON travel_bookings
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_travel_experiences_active ON travel_experiences(is_active);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_user ON travel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_reference ON travel_bookings(booking_reference);
