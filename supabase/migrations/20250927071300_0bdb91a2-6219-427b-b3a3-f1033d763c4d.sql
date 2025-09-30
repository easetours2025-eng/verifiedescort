-- Fix security issue: Restrict public access to celebrity profiles
-- Remove the overly permissive public policy that exposes email addresses
DROP POLICY IF EXISTS "Public can view basic celebrity profile info" ON public.celebrity_profiles;

-- Create a view for public celebrity data that excludes sensitive information
CREATE OR REPLACE VIEW public.public_celebrity_profiles AS
SELECT 
  id,
  stage_name,
  bio,
  profile_picture_path,
  base_price,
  hourly_rate,
  is_verified,
  is_available,
  location,
  gender,
  social_instagram,
  social_twitter,
  social_tiktok,
  age,
  created_at,
  updated_at
FROM public.celebrity_profiles
WHERE is_available = true;

-- Create a security definer function for safe public access
CREATE OR REPLACE FUNCTION public.get_public_celebrity_data(celebrity_profile_id uuid DEFAULT NULL)
RETURNS TABLE (
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone
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
    cp.created_at,
    cp.updated_at
  FROM celebrity_profiles cp
  WHERE (celebrity_profile_id IS NULL OR cp.id = celebrity_profile_id)
    AND cp.is_available = true;
$$;

-- Block all direct public access to the celebrity_profiles table
CREATE POLICY "Block public access to celebrity profiles" 
ON public.celebrity_profiles 
FOR SELECT 
USING (false);