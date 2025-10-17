-- Update get_celebrities_with_subscription function to return gender as text[]
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
  gender text[],  -- Changed from text to text[]
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
SET search_path = public
AS $$
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
    COALESCE(asub.priority, 5) as tier_priority
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
  ORDER BY COALESCE(asub.priority, 5) ASC, cp.created_at DESC;
END;
$$;

-- Update get_safe_celebrity_profiles function to return gender as text[]
DROP FUNCTION IF EXISTS public.get_safe_celebrity_profiles(uuid);

CREATE OR REPLACE FUNCTION public.get_safe_celebrity_profiles(celebrity_id uuid DEFAULT NULL::uuid)
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
  gender text[],  -- Changed from text to text[]
  social_instagram text,
  social_twitter text,
  social_tiktok text,
  age integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  WITH launch_info AS (
    SELECT 
      (config_value::timestamp with time zone) as launch_date,
      (now() < (config_value::timestamp with time zone)) as in_grace_period
    FROM system_config 
    WHERE config_key = 'launch_date'
    LIMIT 1
  )
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
  CROSS JOIN launch_info li
  WHERE (celebrity_id IS NULL OR cp.id = celebrity_id)
    AND (
      li.in_grace_period = true
      OR
      (li.in_grace_period = false AND is_celebrity_subscription_active(cp.id))
      OR
      is_special_offer_active(cp.created_at, cp.special_offer_registered_at)
    );
$function$;

-- Update get_non_admin_celebrities function to return gender as text[]
DROP FUNCTION IF EXISTS public.get_non_admin_celebrities();

CREATE OR REPLACE FUNCTION public.get_non_admin_celebrities()
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
  gender text[],  -- Changed from text to text[]
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
SET search_path = 'public'
AS $function$
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
  WHERE au.email NOT IN (SELECT admin_users.email FROM admin_users)
  ORDER BY cp.created_at DESC;
END;
$function$;

-- Update get_public_celebrity_data function to return gender as text[]
DROP FUNCTION IF EXISTS public.get_public_celebrity_data(uuid);

CREATE OR REPLACE FUNCTION public.get_public_celebrity_data(celebrity_profile_id uuid DEFAULT NULL::uuid)
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
  gender text[],  -- Changed from text to text[]
  social_instagram text,
  social_twitter text,
  social_tiktok text,
  age integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- Update get_public_celebrity_profiles function to return gender as text[]
DROP FUNCTION IF EXISTS public.get_public_celebrity_profiles();

CREATE OR REPLACE FUNCTION public.get_public_celebrity_profiles()
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
  gender text[],  -- Changed from text to text[]
  social_instagram text,
  social_twitter text,
  social_tiktok text,
  age integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $function$
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
  WHERE cp.is_available = true;
$function$;