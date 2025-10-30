-- Update existing celebrities without a country to Kenya (default)
UPDATE celebrity_profiles 
SET country = 'Kenya' 
WHERE country IS NULL OR country = '';

-- Update available_countries to mark Kenya as East Africa
UPDATE available_countries 
SET is_east_africa = true 
WHERE country_name = 'Kenya';

-- Insert Kenya if it doesn't exist
INSERT INTO available_countries (country_name, is_east_africa)
VALUES ('Kenya', true)
ON CONFLICT (country_name) DO UPDATE SET is_east_africa = true;

-- Add PayPal payment type support to payment_verification table
-- The payment_type column should already exist from previous migration
-- If it doesn't, add it:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_verification' 
    AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE payment_verification 
    ADD COLUMN payment_type TEXT DEFAULT 'subscription';
  END IF;
END $$;

COMMENT ON COLUMN payment_verification.phone_number IS 'For M-Pesa: phone number; For PayPal: PayPal email';
COMMENT ON COLUMN payment_verification.mpesa_code IS 'For M-Pesa: transaction code; For PayPal: transaction ID';