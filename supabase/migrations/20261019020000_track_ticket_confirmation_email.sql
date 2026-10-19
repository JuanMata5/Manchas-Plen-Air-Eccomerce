ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ticket_email_sent_at TIMESTAMPTZ;
