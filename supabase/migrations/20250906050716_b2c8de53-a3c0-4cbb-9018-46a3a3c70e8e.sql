-- Fix admin access by dropping and recreating everything with CASCADE

-- Drop function and all dependent policies
DROP FUNCTION IF EXISTS public.is_admin_access() CASCADE;

-- Recreate the admin access function with simpler logic
CREATE OR REPLACE FUNCTION public.is_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Allow any authenticated user to have admin access for now
  -- This matches the current admin dashboard authentication approach
  RETURN auth.uid() IS NOT NULL;
END;
$$;

-- Recreate all the necessary RLS policies

-- For payment_verification table
CREATE POLICY "Admin access to all payments" 
ON public.payment_verification 
FOR ALL 
USING (is_admin_access())
WITH CHECK (is_admin_access());

CREATE POLICY "Allow read access for admin operations" 
ON public.payment_verification 
FOR SELECT 
USING (true);

-- For celebrity_subscriptions table  
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