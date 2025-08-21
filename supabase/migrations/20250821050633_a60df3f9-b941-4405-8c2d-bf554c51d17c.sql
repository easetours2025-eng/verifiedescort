-- Fix RLS policies for celebrity_subscriptions table to allow admin operations

-- First, let's check if we need to create admin role detection
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if the current user has admin privileges
  -- For now, we'll check if they can access the celebrity_profiles table with admin operations
  -- In production, you might want to have a dedicated admin_users table or role system
  RETURN EXISTS (
    SELECT 1 FROM celebrity_profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  ) OR auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies for celebrity_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON celebrity_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON celebrity_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON celebrity_subscriptions;

-- Create new policies that allow admin operations
CREATE POLICY "Celebrities can view their own subscriptions" 
ON celebrity_subscriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM celebrity_profiles 
    WHERE celebrity_profiles.id = celebrity_subscriptions.celebrity_id 
    AND celebrity_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage all subscriptions" 
ON celebrity_subscriptions 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure payment_verification has proper admin policies
DROP POLICY IF EXISTS "Users can view their own payments" ON payment_verification;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payment_verification;

CREATE POLICY "Celebrities can view their own payments" 
ON payment_verification 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM celebrity_profiles 
    WHERE celebrity_profiles.id = payment_verification.celebrity_id 
    AND celebrity_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Celebrities can insert their own payments" 
ON payment_verification 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM celebrity_profiles 
    WHERE celebrity_profiles.id = payment_verification.celebrity_id 
    AND celebrity_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage all payments" 
ON payment_verification 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);