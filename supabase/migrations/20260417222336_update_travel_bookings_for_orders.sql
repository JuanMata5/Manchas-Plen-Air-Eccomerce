-- Add new columns to travel_bookings to support order integration
ALTER TABLE public.travel_bookings
ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
ADD COLUMN location TEXT,
ADD COLUMN dates TEXT,
ADD COLUMN price_usd DECIMAL(10, 2),
ADD COLUMN price_ars_blue DECIMAL(12, 2),
ALTER COLUMN customer_phone DROP NOT NULL,
ALTER COLUMN plan_price_usd DROP NOT NULL;

-- Create index for order_id lookups
CREATE INDEX IF NOT EXISTS idx_travel_bookings_order ON public.travel_bookings(order_id);
