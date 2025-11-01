-- Update payment type constraint to include all existing and new types
ALTER TABLE payment_verification 
DROP CONSTRAINT IF EXISTS payment_verification_payment_type_check;

ALTER TABLE payment_verification
ADD CONSTRAINT payment_verification_payment_type_check 
CHECK (payment_type IN ('subscription', 'featured', 'free_trial', 'promotional_offer'));