-- A QR token is deliberately separate from the human reservation reference.
ALTER TABLE public.travel_bookings
  ADD COLUMN IF NOT EXISTS qr_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS balance_payment_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

UPDATE public.travel_bookings SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;
ALTER TABLE public.travel_bookings ALTER COLUMN qr_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_travel_bookings_qr_token ON public.travel_bookings(qr_token);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_balance_payment_order ON public.travel_bookings(balance_payment_order_id);
