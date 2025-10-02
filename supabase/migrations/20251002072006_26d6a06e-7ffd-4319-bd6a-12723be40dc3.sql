-- Fix security warning by setting search_path on the function
DROP FUNCTION IF EXISTS get_non_admin_celebrities();

CREATE OR REPLACE FUNCTION get_non_admin_celebrities()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  stage_name text,
  real_name text,
  bio text,
  profile_picture_path text,
  phone_number text,
  email text,
  location text,
  age integer,
  date_of_birth date,
  gender text,
  base_price numeric,
  hourly_rate numeric,
  is_available boolean,
  is_verified boolean,
  social_instagram text,
  social_twitter text,
  social_tiktok text,
  is_special_offer_active boolean,
  special_offer_registered_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.user_id,
    cp.stage_name,
    cp.real_name,
    cp.bio,
    cp.profile_picture_path,
    cp.phone_number,
    cp.email,
    cp.location,
    cp.age,
    cp.date_of_birth,
    cp.gender,
    cp.base_price,
    cp.hourly_rate,
    cp.is_available,
    cp.is_verified,
    cp.social_instagram,
    cp.social_twitter,
    cp.social_tiktok,
    cp.is_special_offer_active,
    cp.special_offer_registered_at,
    cp.created_at,
    cp.updated_at
  FROM celebrity_profiles cp
  INNER JOIN auth.users au ON cp.user_id = au.id
  WHERE au.email NOT IN (SELECT email FROM admin_users)
  ORDER BY cp.created_at DESC;
END;
$$;