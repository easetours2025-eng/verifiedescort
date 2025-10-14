-- Update get_celebrities_with_subscription to require profile picture and phone number
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
    COALESCE(asub.priority, 5) as tier_priority
  FROM celebrity_profiles cp
  INNER JOIN auth.users au ON cp.user_id = au.id
  LEFT JOIN active_subs asub ON cp.id = asub.celebrity_id
  WHERE au.email NOT IN (SELECT admin_users.email FROM admin_users)
    AND cp.is_verified = true  -- Payment must be verified by admin
    AND cp.is_available = true  -- Profile must be marked as available
    AND cp.profile_picture_path IS NOT NULL  -- Must have profile picture
    AND cp.profile_picture_path != ''  -- Profile picture path must not be empty
    AND cp.phone_number IS NOT NULL  -- Must have phone number
    AND cp.phone_number != ''  -- Phone number must not be empty
  ORDER BY COALESCE(asub.priority, 5) ASC, cp.created_at DESC;
END;
$function$;