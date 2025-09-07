-- Fix RLS policies for celebrity_subscriptions - properly handle all existing policies
-- Drop ALL existing policies on celebrity_subscriptions
DROP POLICY IF EXISTS "Anyone can view active subscriptions" ON public.celebrity_subscriptions;
DROP POLICY IF EXISTS "Celebrities can view their own subscriptions" ON public.celebrity_subscriptions;
DROP POLICY IF EXISTS "Admin users can manage all subscriptions" ON public.celebrity_subscriptions;
DROP POLICY IF EXISTS "Allow subscription creation for verified payments" ON public.celebrity_subscriptions;
DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON public.celebrity_subscriptions;
DROP POLICY IF EXISTS "Celebrities can manage their own subscriptions" ON public.celebrity_subscriptions;

-- Drop ALL existing policies on payment_verification  
DROP POLICY IF EXISTS "Celebrities can manage their own payments" ON public.payment_verification;
DROP POLICY IF EXISTS "Admin access to all payments" ON public.payment_verification;
DROP POLICY IF EXISTS "Allow read access for admin operations" ON public.payment_verification;
DROP POLICY IF EXISTS "Admin access to all payments for development" ON public.payment_verification;

-- Create new simplified policies for celebrity_subscriptions (development mode)
CREATE POLICY "Public can view active subscriptions" 
ON public.celebrity_subscriptions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Development admin full access" 
ON public.celebrity_subscriptions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create new simplified policies for payment_verification (development mode) 
CREATE POLICY "Development admin payment access" 
ON public.payment_verification 
FOR ALL 
USING (true)
WITH CHECK (true);