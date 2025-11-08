-- Create a function to automatically deactivate expired subscriptions
CREATE OR REPLACE FUNCTION public.deactivate_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Deactivate subscriptions that have expired
  UPDATE celebrity_subscriptions
  SET is_active = false
  WHERE is_active = true
    AND subscription_end < now();
  
  -- Unverify celebrities with expired subscriptions
  UPDATE celebrity_profiles
  SET is_verified = false, is_available = false
  WHERE id IN (
    SELECT celebrity_id 
    FROM celebrity_subscriptions 
    WHERE is_active = false
  )
  AND NOT EXISTS (
    -- Keep verified if they have any active subscription
    SELECT 1 
    FROM celebrity_subscriptions cs 
    WHERE cs.celebrity_id = celebrity_profiles.id 
      AND cs.is_active = true 
      AND cs.subscription_end > now()
  );
END;
$$;

-- Update the auto_unverify_expired_celebrities function to also deactivate subscriptions
CREATE OR REPLACE FUNCTION public.auto_unverify_expired_celebrities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First deactivate expired subscriptions
  PERFORM public.deactivate_expired_subscriptions();
END;
$$;

-- Update get_celebrities_with_subscription to only return celebrities with ACTIVE subscriptions
CREATE OR REPLACE FUNCTION public.get_celebrities_with_subscription()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  stage_name text,
  real_name text,
  bio text,
  age integer,
  date_of_birth date,
  gender text[],
  country text,
  location text,
  phone_number text,
  email text,
  profile_picture_path text,
  base_price numeric,
  hourly_rate numeric,
  is_verified boolean,
  is_available boolean,
  is_special_offer_active boolean,
  special_offer_registered_at timestamp with time zone,
  social_instagram text,
  social_twitter text,
  social_tiktok text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  subscription_tier text,
  duration_type text,
  subscription_end timestamp with time zone,
  tier_priority integer,
  is_featured boolean,
  featured_until timestamp with time zone
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
    cp.age,
    cp.date_of_birth,
    cp.gender,
    cp.country,
    cp.location,
    cp.phone_number,
    cp.email,
    cp.profile_picture_path,
    cp.base_price,
    cp.hourly_rate,
    cp.is_verified,
    cp.is_available,
    cp.is_special_offer_active,
    cp.special_offer_registered_at,
    cp.social_instagram,
    cp.social_twitter,
    cp.social_tiktok,
    cp.created_at,
    cp.updated_at,
    COALESCE(cs.subscription_tier, 'no_subscription') as subscription_tier,
    cs.duration_type,
    cs.subscription_end,
    CASE 
      WHEN cs.subscription_tier = 'vip_elite' THEN 1
      WHEN cs.subscription_tier = 'prime_plus' THEN 2
      WHEN cs.subscription_tier = 'basic_pro' THEN 3
      WHEN cs.subscription_tier = 'starter' THEN 4
      ELSE 5
    END as tier_priority,
    (cp.featured_until IS NOT NULL AND cp.featured_until > NOW()) as is_featured,
    cp.featured_until
  FROM 
    celebrity_profiles cp
  LEFT JOIN 
    celebrity_subscriptions cs ON cp.id = cs.celebrity_id 
      AND cs.is_active = true 
      AND cs.subscription_end > NOW()
  WHERE 
    cp.is_verified = true
    AND cp.is_available = true
  ORDER BY 
    tier_priority ASC,
    cp.created_at DESC;
END;
$$;