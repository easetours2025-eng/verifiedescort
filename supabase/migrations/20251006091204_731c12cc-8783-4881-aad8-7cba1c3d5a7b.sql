-- Fix the get_celebrities_with_subscription function with proper column qualification
DROP FUNCTION IF EXISTS public.get_celebrities_with_subscription();

CREATE OR REPLACE FUNCTION public.get_celebrities_with_subscription()
RETURNS TABLE(
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
  updated_at timestamp with time zone,
  subscription_tier text,
  duration_type text,
  subscription_end timestamp with time zone,
  tier_priority integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    cp.updated_at,
    cs.subscription_tier,
    cs.duration_type,
    cs.subscription_end,
    CASE 
      WHEN cs.subscription_tier = 'vip_elite' THEN 1
      WHEN cs.subscription_tier = 'prime_plus' THEN 2
      WHEN cs.subscription_tier = 'basic_pro' THEN 3
      WHEN cs.subscription_tier = 'starter' THEN 4
      ELSE 5
    END as tier_priority
  FROM celebrity_profiles cp
  INNER JOIN auth.users au ON cp.user_id = au.id
  LEFT JOIN (
    -- Get the active subscription for each celebrity
    SELECT DISTINCT ON (celebrity_id)
      celebrity_id,
      subscription_tier,
      duration_type,
      subscription_end
    FROM celebrity_subscriptions
    WHERE is_active = true 
      AND subscription_end > now()
    ORDER BY celebrity_id, subscription_end DESC
  ) cs ON cp.id = cs.celebrity_id
  WHERE au.email NOT IN (SELECT admin_users.email FROM admin_users)
  ORDER BY 
    CASE 
      WHEN cs.subscription_tier = 'vip_elite' THEN 1
      WHEN cs.subscription_tier = 'prime_plus' THEN 2
      WHEN cs.subscription_tier = 'basic_pro' THEN 3
      WHEN cs.subscription_tier = 'starter' THEN 4
      ELSE 5
    END ASC,
    cp.created_at DESC;
END;
$$;