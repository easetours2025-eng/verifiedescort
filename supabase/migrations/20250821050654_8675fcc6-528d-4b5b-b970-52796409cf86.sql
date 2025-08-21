-- Fix RLS policies for celebrity_subscriptions table to allow admin operations

-- Drop ALL existing policies for celebrity_subscriptions
DROP POLICY IF EXISTS "Celebrities can view their own subscriptions" ON celebrity_subscriptions;
DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON celebrity_subscriptions;
DROP POLICY IF EXISTS "Anyone can view active subscriptions for visibility check" ON celebrity_subscriptions;
DROP POLICY IF EXISTS "Celebrities can view their own subscription status" ON celebrity_subscriptions;

-- Create new comprehensive policies
CREATE POLICY "Admin can manage all subscriptions" 
ON celebrity_subscriptions 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view active subscriptions" 
ON celebrity_subscriptions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Celebrities can view their own subscriptions" 
ON celebrity_subscriptions 
FOR SELECT 
USING (
  celebrity_id IN (
    SELECT id FROM celebrity_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Also fix payment_verification policies
DROP POLICY IF EXISTS "Celebrities can view their own payments" ON payment_verification;
DROP POLICY IF EXISTS "Celebrities can insert their own payments" ON payment_verification;
DROP POLICY IF EXISTS "Admin can manage all payments" ON payment_verification;
DROP POLICY IF EXISTS "Celebrities can submit payment verification" ON payment_verification;
DROP POLICY IF EXISTS "Celebrities can view their own payment records" ON payment_verification;

-- Create comprehensive payment policies
CREATE POLICY "Admin can manage all payments" 
ON payment_verification 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Celebrities can manage their own payments" 
ON payment_verification 
FOR ALL 
USING (
  celebrity_id IN (
    SELECT id FROM celebrity_profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  celebrity_id IN (
    SELECT id FROM celebrity_profiles 
    WHERE user_id = auth.uid()
  )
);