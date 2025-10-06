-- Add payment tracking and credit balance to payment_verification
ALTER TABLE payment_verification 
ADD COLUMN IF NOT EXISTS expected_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'underpaid', 'overpaid')),
ADD COLUMN IF NOT EXISTS credit_balance numeric DEFAULT 0;

-- Add credit balance tracking to celebrity_profiles
ALTER TABLE celebrity_profiles
ADD COLUMN IF NOT EXISTS credit_balance numeric DEFAULT 0;

-- Create a function to handle payment amount validation
CREATE OR REPLACE FUNCTION validate_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
  package_price numeric;
BEGIN
  -- Get the expected price from subscription_packages
  SELECT price INTO package_price
  FROM subscription_packages
  WHERE tier_name = NEW.subscription_tier 
    AND duration_type = NEW.duration_type
    AND is_active = true
  LIMIT 1;

  -- Set expected amount if not already set
  IF NEW.expected_amount = 0 OR NEW.expected_amount IS NULL THEN
    NEW.expected_amount := COALESCE(package_price, 0);
  END IF;

  -- Determine payment status based on amount comparison
  IF NEW.amount < NEW.expected_amount THEN
    NEW.payment_status := 'underpaid';
    NEW.credit_balance := 0;
  ELSIF NEW.amount > NEW.expected_amount THEN
    NEW.payment_status := 'overpaid';
    NEW.credit_balance := NEW.amount - NEW.expected_amount;
  ELSE
    NEW.payment_status := 'pending';
    NEW.credit_balance := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate payment amounts on insert
DROP TRIGGER IF EXISTS validate_payment_on_insert ON payment_verification;
CREATE TRIGGER validate_payment_on_insert
BEFORE INSERT ON payment_verification
FOR EACH ROW
EXECUTE FUNCTION validate_payment_amount();

-- Create function to handle credit updates on verification
CREATE OR REPLACE FUNCTION apply_payment_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment is verified, update celebrity credit balance
  IF NEW.is_verified = true AND OLD.is_verified = false THEN
    -- Add any credit balance to celebrity profile
    IF NEW.credit_balance > 0 THEN
      UPDATE celebrity_profiles
      SET credit_balance = COALESCE(credit_balance, 0) + NEW.credit_balance
      WHERE id = NEW.celebrity_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to apply credits on verification
DROP TRIGGER IF EXISTS apply_credits_on_verification ON payment_verification;
CREATE TRIGGER apply_credits_on_verification
AFTER UPDATE ON payment_verification
FOR EACH ROW
WHEN (NEW.is_verified = true AND OLD.is_verified = false)
EXECUTE FUNCTION apply_payment_credits();

COMMENT ON COLUMN payment_verification.expected_amount IS 'The expected payment amount based on subscription package price';
COMMENT ON COLUMN payment_verification.payment_status IS 'Status: pending, verified, underpaid, or overpaid';
COMMENT ON COLUMN payment_verification.credit_balance IS 'Extra amount paid that will be credited to celebrity account';
COMMENT ON COLUMN celebrity_profiles.credit_balance IS 'Total credit balance available for future subscriptions';