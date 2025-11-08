-- Drop and recreate the function to include subscriptions expiring soon
DROP FUNCTION IF EXISTS public.get_celebrities_with_expired_subscriptions();

CREATE OR REPLACE FUNCTION public.get_celebrities_with_expired_subscriptions()
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
AS $function$
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
  WHERE cs.is_active = true
    AND cs.subscription_end <= (now() + INTERVAL '2 days')  -- Include subscriptions expiring in next 2 days or already expired
    AND au.email NOT IN (SELECT admin_users.email FROM admin_users)
    AND cp.profile_picture_path IS NOT NULL
    AND cp.profile_picture_path != ''
    AND cp.phone_number IS NOT NULL
    AND cp.phone_number != ''
  ORDER BY cp.id, cs.subscription_end DESC;
END;
$function$;