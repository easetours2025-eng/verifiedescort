-- Fix RLS policies for celebrity_subscriptions to allow admin access

-- Drop existing policies that might be blocking admin access
DROP POLICY IF EXISTS "Admin users can manage all subscriptions" ON public.celebrity_subscriptions;

-- Create a comprehensive admin policy for celebrity_subscriptions
CREATE POLICY "Admin users can manage all subscriptions" 
ON public.celebrity_subscriptions 
FOR ALL 
USING (is_admin_access())
WITH CHECK (is_admin_access());

-- Add a policy specifically for inserting subscriptions when verifying payments
CREATE POLICY "Allow subscription creation for verified payments" 
ON public.celebrity_subscriptions 
FOR INSERT 
WITH CHECK (
  -- Allow if admin is creating subscription
  is_admin_access() OR
  -- Allow if celebrity is creating their own subscription
  (celebrity_id IN (
    SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
  ))
);