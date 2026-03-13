-- Fix: add missing columns to align schema with application code

-- orders: rename columns to match app code
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS bank_transfer_ref TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Update increment_coupon_usage to use uses_count (DB) but support used_count (app alias)
-- The DB column is uses_count, so update the function to use that
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE coupons
  SET uses_count = uses_count + 1
  WHERE id = p_coupon_id;
END;
$$;

-- webhook_logs: add typed columns for better querying
ALTER TABLE public.webhook_logs
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT;
