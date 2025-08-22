-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email text;
BEGIN
  -- Get the current user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if this email exists in admin_users table
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = user_email
  );
END;
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin users can manage all payments" ON payment_verification;
DROP POLICY IF EXISTS "Admin users can manage all subscriptions" ON celebrity_subscriptions;

-- Create new policies using the security definer function
CREATE POLICY "Admin users can manage all payments" 
ON payment_verification 
FOR ALL 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admin users can manage all subscriptions" 
ON celebrity_subscriptions 
FOR ALL 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Also create an admin policy for celebrity_profiles to allow admin management
CREATE POLICY "Admin users can manage all celebrity profiles" 
ON celebrity_profiles 
FOR ALL 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());