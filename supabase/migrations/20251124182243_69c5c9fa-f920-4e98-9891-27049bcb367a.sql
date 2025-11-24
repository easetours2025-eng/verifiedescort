-- Update the function to include expired subscriptions for notifications
DROP FUNCTION IF EXISTS public.get_subscriptions_needing_reminders();

CREATE OR REPLACE FUNCTION public.get_subscriptions_needing_reminders()
RETURNS TABLE(
  celebrity_id uuid,
  subscription_id uuid,
  celebrity_name text,
  phone_number text,
  subscription_tier text,
  subscription_end timestamp with time zone,
  reminder_type text,
  days_until_expiry integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH subscription_data AS (
    SELECT 
      cp.id as celebrity_id,
      cs.id as subscription_id,
      cp.stage_name as celebrity_name,
      cp.phone_number,
      cs.subscription_tier,
      cs.subscription_end,
      EXTRACT(day FROM (cs.subscription_end - NOW()))::integer as days_until_expiry
    FROM celebrity_profiles cp
    INNER JOIN celebrity_subscriptions cs ON cp.id = cs.celebrity_id
    WHERE cp.phone_number IS NOT NULL
      AND cp.phone_number != ''
      -- Exclude admin users
      AND NOT EXISTS (
        SELECT 1 FROM admin_users au WHERE au.email = cp.email
      )
      -- Include active subscriptions expiring soon OR expired subscriptions (within 7 days of expiry)
      AND (
        (cs.is_active = true AND cs.subscription_end > NOW() AND cs.subscription_end <= NOW() + INTERVAL '3 days')
        OR 
        (cs.is_active = false AND cs.subscription_end < NOW() AND cs.subscription_end >= NOW() - INTERVAL '7 days')
      )
  )
  SELECT 
    sd.celebrity_id,
    sd.subscription_id,
    sd.celebrity_name,
    sd.phone_number,
    sd.subscription_tier,
    sd.subscription_end,
    CASE 
      WHEN sd.days_until_expiry = 3 THEN '3_days'
      WHEN sd.days_until_expiry = 1 THEN '1_day'
      WHEN sd.days_until_expiry = 0 THEN 'expiry_day'
      WHEN sd.days_until_expiry < 0 AND sd.days_until_expiry >= -1 THEN '1_day_expired'
      WHEN sd.days_until_expiry < -1 AND sd.days_until_expiry >= -3 THEN '3_days_expired'
      WHEN sd.days_until_expiry < -3 THEN '7_days_expired'
    END as reminder_type,
    sd.days_until_expiry
  FROM subscription_data sd
  WHERE (
    -- Pre-expiry reminders
    (sd.days_until_expiry IN (3, 1, 0) AND NOT EXISTS (
      SELECT 1 FROM subscription_reminder_logs srl
      WHERE srl.celebrity_id = sd.celebrity_id
        AND srl.subscription_id = sd.subscription_id
        AND srl.reminder_type = CASE 
          WHEN sd.days_until_expiry = 3 THEN '3_days'
          WHEN sd.days_until_expiry = 1 THEN '1_day'
          WHEN sd.days_until_expiry = 0 THEN 'expiry_day'
        END
        AND srl.sent_at > NOW() - INTERVAL '7 days'
    ))
    OR
    -- Post-expiry reminders (1 day, 3 days, 7 days after expiry)
    (sd.days_until_expiry = -1 AND NOT EXISTS (
      SELECT 1 FROM subscription_reminder_logs srl
      WHERE srl.celebrity_id = sd.celebrity_id
        AND srl.subscription_id = sd.subscription_id
        AND srl.reminder_type = '1_day_expired'
        AND srl.sent_at > NOW() - INTERVAL '7 days'
    ))
    OR
    (sd.days_until_expiry = -3 AND NOT EXISTS (
      SELECT 1 FROM subscription_reminder_logs srl
      WHERE srl.celebrity_id = sd.celebrity_id
        AND srl.subscription_id = sd.subscription_id
        AND srl.reminder_type = '3_days_expired'
        AND srl.sent_at > NOW() - INTERVAL '7 days'
    ))
    OR
    (sd.days_until_expiry = -7 AND NOT EXISTS (
      SELECT 1 FROM subscription_reminder_logs srl
      WHERE srl.celebrity_id = sd.celebrity_id
        AND srl.subscription_id = sd.subscription_id
        AND srl.reminder_type = '7_days_expired'
        AND srl.sent_at > NOW() - INTERVAL '14 days'
    ))
  );
END;
$function$;