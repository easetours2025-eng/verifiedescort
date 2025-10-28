-- Add featured payment tracking columns to payment_verification table
ALTER TABLE payment_verification
ADD COLUMN payment_type text DEFAULT 'subscription' CHECK (payment_type IN ('subscription', 'featured'));

-- Add featured status tracking to celebrity_profiles
ALTER TABLE celebrity_profiles
ADD COLUMN featured_until timestamp with time zone,
ADD COLUMN featured_payment_id uuid REFERENCES payment_verification(id);

-- Create index for efficient featured celebrity queries
CREATE INDEX idx_celebrity_featured ON celebrity_profiles(featured_until);

-- Drop existing function to recreate with new signature
DROP FUNCTION IF EXISTS public.get_celebrities_with_subscription();

-- Create updated function to prioritize featured celebrities
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
  gender text[],
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
  tier_priority integer,
  is_featured boolean,
  featured_until timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH active_subs AS (
    SELECT DISTINCT ON (cs.celebrity_id)
      cs.celebrity_id,
      cs.subscription_tier as sub_tier,
      cs.duration_type as sub_duration,
      cs.subscription_end as sub_end,
      CASE 
        WHEN cs.subscription_tier = 'vip_elite' THEN 1
        WHEN cs.subscription_tier = 'prime_plus' THEN 2
        WHEN cs.subscription_tier = 'basic_pro' THEN 3
        WHEN cs.subscription_tier = 'starter' THEN 4
        ELSE 5
      END as priority
    FROM celebrity_subscriptions cs
    WHERE cs.is_active = true 
      AND cs.subscription_end > now()
    ORDER BY cs.celebrity_id, cs.subscription_end DESC
  )
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
    asub.sub_tier as subscription_tier,
    asub.sub_duration as duration_type,
    asub.sub_end as subscription_end,
    COALESCE(asub.priority, 5) as tier_priority,
    (cp.featured_until IS NOT NULL AND cp.featured_until > now()) as is_featured,
    cp.featured_until
  FROM celebrity_profiles cp
  INNER JOIN auth.users au ON cp.user_id = au.id
  LEFT JOIN active_subs asub ON cp.id = asub.celebrity_id
  WHERE au.email NOT IN (SELECT admin_users.email FROM admin_users)
    AND cp.is_verified = true
    AND cp.is_available = true
    AND cp.profile_picture_path IS NOT NULL
    AND cp.profile_picture_path != ''
    AND cp.phone_number IS NOT NULL
    AND cp.phone_number != ''
    AND cp.age IS NOT NULL
  ORDER BY 
    (cp.featured_until IS NOT NULL AND cp.featured_until > now()) DESC,
    COALESCE(asub.priority, 5) ASC, 
    cp.created_at DESC;
END;
$function$;