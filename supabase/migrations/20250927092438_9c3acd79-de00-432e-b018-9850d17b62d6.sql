-- Fix celebrity profiles security issue
-- The is_admin_access() function was allowing everyone admin access, which exposed all celebrity data

-- 1. Fix the is_admin_access function to properly check admin status
CREATE OR REPLACE FUNCTION public.is_admin_access()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admin access for actual verified admins
  -- Use the existing is_current_user_admin function for proper validation
  RETURN is_current_user_admin();
END;
$$;

-- 2. Drop the existing problematic RLS policies and create secure ones
DROP POLICY IF EXISTS "Admin users can manage all celebrity profiles" ON celebrity_profiles;
DROP POLICY IF EXISTS "Block public access to celebrity profiles" ON celebrity_profiles;
DROP POLICY IF EXISTS "Celebrities can view their own complete profile" ON celebrity_profiles;
DROP POLICY IF EXISTS "Users can create their own celebrity profile" ON celebrity_profiles;
DROP POLICY IF EXISTS "Users can delete their own celebrity profile" ON celebrity_profiles;
DROP POLICY IF EXISTS "Users can update their own celebrity profile" ON celebrity_profiles;

-- 3. Create secure RLS policies that protect sensitive data
-- Block all public access completely
CREATE POLICY "Block all public access to celebrity profiles"
ON celebrity_profiles FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Allow authenticated celebrities to view and manage their own profiles
CREATE POLICY "Celebrities can manage their own profiles"
ON celebrity_profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow verified admins to manage all profiles
CREATE POLICY "Verified admins can manage all celebrity profiles"
ON celebrity_profiles FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 4. Ensure the public_celebrity_profiles view is safe and doesn't expose sensitive data
-- The view already excludes sensitive fields like email, phone_number, real_name, date_of_birth
-- But let's make sure it only shows available celebrities and add RLS

-- Enable RLS on the view (this may not be directly possible, so we'll control access through functions)
-- Instead, let's create a secure function for public access

-- 5. Create a secure function that only returns safe celebrity data
CREATE OR REPLACE FUNCTION public.get_safe_celebrity_profiles(celebrity_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  stage_name text,
  bio text,
  profile_picture_path text,
  base_price numeric,
  hourly_rate numeric,
  is_verified boolean,
  is_available boolean,
  location text,
  gender text,
  social_instagram text,
  social_twitter text,
  social_tiktok text,
  age integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cp.id,
    cp.stage_name,
    cp.bio,
    cp.profile_picture_path,
    cp.base_price,
    cp.hourly_rate,
    cp.is_verified,
    cp.is_available,
    cp.location,
    cp.gender,
    cp.social_instagram,
    cp.social_twitter,
    cp.social_tiktok,
    cp.age,
    cp.created_at
  FROM celebrity_profiles cp
  WHERE cp.is_available = true
    AND (celebrity_id IS NULL OR cp.id = celebrity_id);
$$;

-- 6. Grant public access to the safe function only
GRANT EXECUTE ON FUNCTION public.get_safe_celebrity_profiles TO public;

-- 7. Revoke any public access to the celebrity_profiles table (should already be blocked by RLS)
REVOKE ALL ON celebrity_profiles FROM public;