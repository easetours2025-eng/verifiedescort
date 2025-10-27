-- Update the get_celebrities_with_subscription function to filter properly
DROP FUNCTION IF EXISTS get_celebrities_with_subscription();

CREATE OR REPLACE FUNCTION get_celebrities_with_subscription()
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
    AND cp.age IS NOT NULL
  ORDER BY COALESCE(asub.priority, 5) ASC, cp.created_at DESC;
END;
$$;

-- Create call_clicks table for tracking call button clicks
CREATE TABLE IF NOT EXISTS public.call_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  celebrity_id uuid NOT NULL REFERENCES celebrity_profiles(id) ON DELETE CASCADE,
  user_ip text,
  user_id uuid,
  clicked_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for call_clicks
CREATE POLICY "Anyone can record call clicks"
  ON public.call_clicks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all call clicks"
  ON public.call_clicks
  FOR SELECT
  USING (is_current_user_admin());

CREATE POLICY "Celebrities can view their own call clicks"
  ON public.call_clicks
  FOR SELECT
  USING (
    celebrity_id IN (
      SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
    )
  );

-- Create function to get call click statistics
CREATE OR REPLACE FUNCTION get_call_click_statistics()
RETURNS TABLE(
  celebrity_id uuid,
  click_count bigint,
  click_date timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cc.celebrity_id,
    COUNT(*) as click_count,
    DATE_TRUNC('day', cc.clicked_at) as click_date
  FROM call_clicks cc
  GROUP BY cc.celebrity_id, DATE_TRUNC('day', cc.clicked_at);
$$;

-- Create function to get celebrities with expired subscriptions
CREATE OR REPLACE FUNCTION get_celebrities_with_expired_subscriptions()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  stage_name text,
  phone_number text,
  email text,
  subscription_end timestamp with time zone,
  subscription_tier text,
  days_expired integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (cp.id)
    cp.id,
    cp.user_id,
    cp.stage_name,
    cp.phone_number,
    cp.email,
    cs.subscription_end,
    cs.subscription_tier,
    EXTRACT(DAY FROM (now() - cs.subscription_end))::integer as days_expired
  FROM celebrity_profiles cp
  INNER JOIN celebrity_subscriptions cs ON cp.id = cs.celebrity_id
  INNER JOIN auth.users au ON cp.user_id = au.id
  WHERE cs.subscription_end < now()
    AND au.email NOT IN (SELECT admin_users.email FROM admin_users)
    AND cp.profile_picture_path IS NOT NULL
    AND cp.profile_picture_path != ''
    AND cp.phone_number IS NOT NULL
    AND cp.phone_number != ''
  ORDER BY cp.id, cs.subscription_end DESC;
END;
$$;