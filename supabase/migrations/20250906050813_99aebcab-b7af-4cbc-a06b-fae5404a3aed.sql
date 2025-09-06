-- Fix the policy conflict by properly managing existing policies

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow read access for admin operations" ON public.payment_verification;
DROP POLICY IF EXISTS "Admin access to all payments" ON public.payment_verification;
DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON public.celebrity_subscriptions;
DROP POLICY IF EXISTS "Celebrities can manage their own subscriptions" ON public.celebrity_subscriptions;

-- Now recreate the payment_verification policies
CREATE POLICY "Admin access to all payments" 
ON public.payment_verification 
FOR ALL 
USING (is_admin_access())
WITH CHECK (is_admin_access());

CREATE POLICY "Allow read access for admin operations" 
ON public.payment_verification 
FOR SELECT 
USING (true);

-- Recreate celebrity_subscriptions policies
CREATE POLICY "Admin can manage all subscriptions" 
ON public.celebrity_subscriptions 
FOR ALL 
USING (is_admin_access())
WITH CHECK (is_admin_access());

CREATE POLICY "Celebrities can manage their own subscriptions" 
ON public.celebrity_subscriptions 
FOR ALL 
USING (
  celebrity_id IN (
    SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  celebrity_id IN (
    SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
  )
);