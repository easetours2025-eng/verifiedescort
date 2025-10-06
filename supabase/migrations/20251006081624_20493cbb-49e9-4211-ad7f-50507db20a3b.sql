-- Add unique constraint on celebrity_id for celebrity_subscriptions
ALTER TABLE celebrity_subscriptions 
DROP CONSTRAINT IF EXISTS celebrity_subscriptions_celebrity_id_key;

ALTER TABLE celebrity_subscriptions 
ADD CONSTRAINT celebrity_subscriptions_celebrity_id_key UNIQUE (celebrity_id);

-- Update RLS policies for celebrity_subscriptions to allow admin updates
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON celebrity_subscriptions;

CREATE POLICY "Admins can manage all subscriptions" ON celebrity_subscriptions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Update RLS policies for payment_verification to allow admin updates
DROP POLICY IF EXISTS "Admins can update payment verification" ON payment_verification;

CREATE POLICY "Admins can update payment verification" ON payment_verification
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Update RLS policies for celebrity_profiles to allow admin updates
DROP POLICY IF EXISTS "Admins can update celebrity profiles" ON celebrity_profiles;

CREATE POLICY "Admins can update celebrity profiles" ON celebrity_profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);