-- Update payment_verification constraint to allow welcome_offer payment type
ALTER TABLE payment_verification 
DROP CONSTRAINT IF EXISTS payment_verification_payment_type_check;

ALTER TABLE payment_verification
ADD CONSTRAINT payment_verification_payment_type_check 
CHECK (payment_type IN ('subscription', 'featured', 'free_trial', 'promotional_offer', 'welcome_offer'));