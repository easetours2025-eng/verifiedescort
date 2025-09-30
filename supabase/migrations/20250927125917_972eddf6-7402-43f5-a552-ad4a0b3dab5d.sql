-- Add special 5-day offer system
-- Add columns to track the special offer
ALTER TABLE celebrity_profiles 
ADD COLUMN IF NOT EXISTS special_offer_registered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_special_offer_active BOOLEAN DEFAULT false;

-- Create a function to check if the 5-day special offer is active for a profile
CREATE OR REPLACE FUNCTION public.is_special_offer_active(profile_created_at TIMESTAMP WITH TIME ZONE, special_offer_registered_at TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    special_offer_registered_at IS NOT NULL 
    AND special_offer_registered_at >= '2025-01-27 00:00:00+00'::TIMESTAMP WITH TIME ZONE
    AND special_offer_registered_at <= '2025-02-01 23:59:59+00'::TIMESTAMP WITH TIME ZONE
    AND NOW() <= (special_offer_registered_at + INTERVAL '5 days');
$$;

-- Update the get_safe_celebrity_profiles function to include special offer profiles
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
  gender text, 
  social_instagram text, 
  social_twitter text, 
  social_tiktok text, 
  age integer, 
  created_at timestamp with time zone
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
  WHERE (celebrity_id IS NULL OR cp.id = celebrity_id)
    AND (
      cp.is_available = true 
      OR is_special_offer_active(cp.created_at, cp.special_offer_registered_at)
    );
$$;

-- Create a function to activate special offer for new registrations
CREATE OR REPLACE FUNCTION public.activate_special_offer_for_new_celebrity()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if we're within the 5-day offer period (January 27 - February 1, 2025)
  IF NOW() >= '2025-01-27 00:00:00+00'::TIMESTAMP WITH TIME ZONE 
     AND NOW() <= '2025-02-01 23:59:59+00'::TIMESTAMP WITH TIME ZONE THEN
    
    -- Set special offer flags
    NEW.special_offer_registered_at := NOW();
    NEW.is_special_offer_active := true;
    NEW.is_available := true;  -- Make them immediately available
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new celebrity registrations during special offer period
DROP TRIGGER IF EXISTS special_offer_activation ON celebrity_profiles;
CREATE TRIGGER special_offer_activation
  BEFORE INSERT ON celebrity_profiles
  FOR EACH ROW
  EXECUTE FUNCTION activate_special_offer_for_new_celebrity();

-- Update existing handle_new_user function to work with special offer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_offer_period BOOLEAN;
BEGIN
  -- Check if we're in the special offer period
  is_offer_period := (
    NOW() >= '2025-01-27 00:00:00+00'::TIMESTAMP WITH TIME ZONE 
    AND NOW() <= '2025-02-01 23:59:59+00'::TIMESTAMP WITH TIME ZONE
  );
  
  INSERT INTO public.celebrity_profiles (
    user_id, 
    stage_name, 
    email,
    special_offer_registered_at,
    is_special_offer_active,
    is_available
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'stage_name', 'New Celebrity'),
    NEW.email,
    CASE WHEN is_offer_period THEN NOW() ELSE NULL END,
    is_offer_period,
    is_offer_period  -- Auto-available during offer period
  );
  RETURN NEW;
END;
$$;