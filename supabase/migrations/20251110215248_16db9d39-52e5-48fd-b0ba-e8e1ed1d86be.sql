-- Add a manual trigger function for admins to force-expire subscriptions
CREATE OR REPLACE FUNCTION public.force_expire_celebrity_subscription(celebrity_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  subs_updated integer := 0;
  celeb_unverified integer := 0;
BEGIN
  -- Expire the subscription
  UPDATE celebrity_subscriptions
  SET 
    is_active = false,
    subscription_end = NOW() - INTERVAL '1 hour'
  WHERE celebrity_id = celebrity_profile_id
    AND is_active = true
  RETURNING 1 INTO subs_updated;
  
  -- Unverify the celebrity if they have no other active subscriptions
  UPDATE celebrity_profiles
  SET 
    is_verified = false,
    is_available = false
  WHERE id = celebrity_profile_id
    AND NOT EXISTS (
      SELECT 1 
      FROM celebrity_subscriptions cs 
      WHERE cs.celebrity_id = celebrity_profile_id
        AND cs.is_active = true 
        AND cs.subscription_end > NOW()
    )
    AND NOT is_special_offer_active(created_at, special_offer_registered_at)
  RETURNING 1 INTO celeb_unverified;
  
  RETURN jsonb_build_object(
    'success', true,
    'subscription_deactivated', COALESCE(subs_updated, 0) > 0,
    'celebrity_unverified', COALESCE(celeb_unverified, 0) > 0
  );
END;
$function$;