-- Set up cron job to run every hour at minute 0
-- This will automatically check for expired subscriptions and unverify celebrities
SELECT cron.schedule(
  'auto-unverify-expired-subscriptions',
  '0 * * * *',
  $$SELECT public.deactivate_expired_subscriptions();$$
);