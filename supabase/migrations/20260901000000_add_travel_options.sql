-- Add option_groups and payment_modes columns to travel_experiences table
ALTER TABLE travel_experiences
ADD COLUMN IF NOT EXISTS option_groups JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_modes JSONB DEFAULT '[]'::jsonb;

-- Add selected_options column to travel_bookings table to store customer selections
ALTER TABLE travel_bookings
ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS selected_payment_mode TEXT,
ADD COLUMN IF NOT EXISTS payment_installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS options_price_modifier DECIMAL(10, 2) DEFAULT 0;

-- Update comments for documentation
COMMENT ON COLUMN travel_experiences.option_groups IS 'Array of TravelOptionGroup objects defining configurable options for this experience';
COMMENT ON COLUMN travel_experiences.payment_modes IS 'Array of TravelPaymentMode objects defining payment options';
COMMENT ON COLUMN travel_bookings.selected_options IS 'JSON object mapping optionGroupId to selected option id(s)';
COMMENT ON COLUMN travel_bookings.selected_payment_mode IS 'Selected payment mode id';
COMMENT ON COLUMN travel_bookings.payment_installments IS 'Number of installments if applicable';
COMMENT ON COLUMN travel_bookings.options_price_modifier IS 'Total price modification from selected options';

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_travel_bookings_payment_mode ON travel_bookings(selected_payment_mode);
