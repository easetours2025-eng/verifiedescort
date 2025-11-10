-- Create monitoring table for automatic unverification logs
CREATE TABLE IF NOT EXISTS public.auto_unverify_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at timestamp with time zone DEFAULT now(),
  subscriptions_deactivated integer DEFAULT 0,
  celebrities_unverified integer DEFAULT 0
);

-- Enable RLS on auto_unverify_logs
ALTER TABLE public.auto_unverify_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view logs
CREATE POLICY "Admins can view auto unverify logs"
ON public.auto_unverify_logs
FOR SELECT
TO authenticated
USING (is_user_admin());

-- Allow system to insert logs
CREATE POLICY "System can insert auto unverify logs"
ON public.auto_unverify_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update deactivate_expired_subscriptions function with logging
CREATE OR REPLACE FUNCTION public.deactivate_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  subs_count integer := 0;
  celebs_count integer := 0;
BEGIN
  -- Deactivate expired subscriptions
  WITH deactivated AS (
    UPDATE celebrity_subscriptions
    SET is_active = false
    WHERE is_active = true
      AND subscription_end < now()
    RETURNING celebrity_id
  )
  SELECT COUNT(*)::integer INTO subs_count FROM deactivated;
  
  -- Unverify celebrities with no active subscriptions
  WITH unverified AS (
    UPDATE celebrity_profiles
    SET is_verified = false, is_available = false
    WHERE id IN (
      SELECT celebrity_id 
      FROM celebrity_subscriptions 
      WHERE is_active = false
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM celebrity_subscriptions cs 
      WHERE cs.celebrity_id = celebrity_profiles.id 
        AND cs.is_active = true 
        AND cs.subscription_end > now()
    )
    AND NOT is_special_offer_active(created_at, special_offer_registered_at)
    RETURNING id
  )
  SELECT COUNT(*)::integer INTO celebs_count FROM unverified;
  
  -- Log the execution
  INSERT INTO auto_unverify_logs (subscriptions_deactivated, celebrities_unverified)
  VALUES (subs_count, celebs_count);
  
  RAISE NOTICE 'Deactivated % subscriptions, unverified % celebrities', subs_count, celebs_count;
END;
$function$;