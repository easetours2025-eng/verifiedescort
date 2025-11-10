-- Create table to track sent subscription reminders
CREATE TABLE IF NOT EXISTS public.subscription_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id uuid NOT NULL REFERENCES celebrity_profiles(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('3_days', '1_day', 'expiry_day')),
  phone_number text NOT NULL,
  message_sent text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  twilio_message_sid text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'undelivered'))
);

-- Enable RLS
ALTER TABLE public.subscription_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all reminder logs"
ON public.subscription_reminder_logs
FOR SELECT
TO authenticated
USING (is_user_admin());

-- System can insert logs
CREATE POLICY "System can insert reminder logs"
ON public.subscription_reminder_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_reminder_logs_celebrity_subscription 
ON public.subscription_reminder_logs(celebrity_id, subscription_id, reminder_type);

-- Function to find subscriptions needing reminders
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
    WHERE cs.is_active = true
      AND cs.subscription_end > NOW()
      AND cp.phone_number IS NOT NULL
      AND cp.phone_number != ''
      -- Exclude admin users
      AND NOT EXISTS (
        SELECT 1 FROM admin_users au WHERE au.email = cp.email
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
    END as reminder_type,
    sd.days_until_expiry
  FROM subscription_data sd
  WHERE sd.days_until_expiry IN (3, 1, 0)
    -- Check if reminder hasn't been sent yet
    AND NOT EXISTS (
      SELECT 1 FROM subscription_reminder_logs srl
      WHERE srl.celebrity_id = sd.celebrity_id
        AND srl.subscription_id = sd.subscription_id
        AND srl.reminder_type = CASE 
          WHEN sd.days_until_expiry = 3 THEN '3_days'
          WHEN sd.days_until_expiry = 1 THEN '1_day'
          WHEN sd.days_until_expiry = 0 THEN 'expiry_day'
        END
        -- Only check for reminders sent in the last 7 days to handle edge cases
        AND srl.sent_at > NOW() - INTERVAL '7 days'
    );
END;
$function$;

-- Schedule cron job to send reminders daily at 9 AM
SELECT cron.schedule(
  'send-subscription-reminders',
  '0 9 * * *',  -- Every day at 9 AM
  $$
  SELECT net.http_post(
    url := 'https://kpjqcrhoablsllkgonbl.supabase.co/functions/v1/send-subscription-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwanFjcmhvYWJsc2xsa2dvbmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTY3NTksImV4cCI6MjA3MTI5Mjc1OX0.Guwh9JOeCCYUsqQfVANA-Kiqwl9yi_jGv92ZARqxl1w"}'::jsonb
  ) as request_id;
  $$
);