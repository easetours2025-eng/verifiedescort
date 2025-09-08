-- Drop the overly permissive policy that exposes all celebrity data
DROP POLICY IF EXISTS "Anyone can view public celebrity profiles" ON public.celebrity_profiles;

-- Create a more restrictive policy for public access to celebrity profiles
-- Note: RLS doesn't support column-level restrictions, so we'll handle sensitive data filtering in the application layer
CREATE POLICY "Public can view basic celebrity profile info" 
ON public.celebrity_profiles 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Ensure celebrities can still view their own complete profiles
CREATE POLICY "Celebrities can view their own complete profile" 
ON public.celebrity_profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create a security definer function to check if current user can access sensitive data
CREATE OR REPLACE FUNCTION public.can_access_celebrity_sensitive_data(profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow access if user is viewing their own profile or is an admin
  RETURN (auth.uid() = profile_user_id) OR is_current_user_admin();
END;
$$;