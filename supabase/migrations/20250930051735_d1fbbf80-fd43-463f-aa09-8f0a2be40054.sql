-- Add system configuration table for launch date
CREATE TABLE IF NOT EXISTS public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Public can read system config
CREATE POLICY "Anyone can read system config"
ON public.system_config
FOR SELECT
USING (true);

-- Only admins can manage system config
CREATE POLICY "Admins can manage system config"
ON public.system_config
FOR ALL
USING (is_admin_access())
WITH CHECK (is_admin_access());

-- Insert the launch date (30 days from today)
INSERT INTO public.system_config (config_key, config_value)
VALUES ('launch_date', '2025-01-30T00:00:00Z')
ON CONFLICT (config_key) DO NOTHING;

-- Update the get_safe_celebrity_profiles function to respect grace period
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
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
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
      -- During grace period: show all celebrities
      li.in_grace_period = true
      OR
      -- After grace period: only show those with active subscriptions
      (li.in_grace_period = false AND is_celebrity_subscription_active(cp.id))
      OR
      -- Always show during special offer period
      is_special_offer_active(cp.created_at, cp.special_offer_registered_at)
    );
$$;

-- Function to check if we're in grace period
CREATE OR REPLACE FUNCTION public.is_in_grace_period()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM system_config 
    WHERE config_key = 'launch_date' 
    AND now() < (config_value::timestamp with time zone)
  );
$$;