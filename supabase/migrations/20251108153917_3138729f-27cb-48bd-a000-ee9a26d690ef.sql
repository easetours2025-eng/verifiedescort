-- Fix the get_celebrities_with_expired_subscriptions function to properly return all expired subscriptions
CREATE OR REPLACE FUNCTION public.get_celebrities_with_expired_subscriptions()
RETURNS TABLE (
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
    CASE 
      WHEN cs.subscription_end < now() THEN 
        EXTRACT(day FROM (now() - cs.subscription_end))::integer
      ELSE 
        -EXTRACT(day FROM (cs.subscription_end - now()))::integer
    END as days_expired
  FROM celebrity_profiles cp
  INNER JOIN celebrity_subscriptions cs ON cp.id = cs.celebrity_id
  WHERE 
    -- Exclude admin users
    NOT EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.email = cp.email
    )
    -- Only include profiles with contact information
    AND (cp.phone_number IS NOT NULL OR cp.email IS NOT NULL)
    -- Include subscriptions that meet either condition:
    -- 1. Active subscriptions expiring within 2 days
    -- 2. Inactive subscriptions that have expired
    AND (
      (cs.is_active = true AND cs.subscription_end <= now() + interval '2 days')
      OR 
      (cs.is_active = false AND cs.subscription_end < now())
    )
  ORDER BY cp.id, cs.subscription_end DESC;
END;
$$;