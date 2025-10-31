-- Create function to automatically unverify celebrities with expired subscriptions
CREATE OR REPLACE FUNCTION public.auto_unverify_expired_celebrities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Unverify celebrities whose subscriptions have expired
  UPDATE celebrity_profiles
  SET is_verified = false
  WHERE id IN (
    SELECT cp.id
    FROM celebrity_profiles cp
    LEFT JOIN celebrity_subscriptions cs ON cs.celebrity_id = cp.id AND cs.is_active = true
    WHERE cp.is_verified = true
    AND (
      cs.id IS NULL  -- No active subscription
      OR cs.subscription_end < now()  -- Subscription has expired
    )
  );
END;
$$;

-- Create a cron job that runs every hour to check and unverify expired subscriptions
-- Note: This requires pg_cron extension which may not be available in all Supabase instances
-- If pg_cron is not available, this can be called manually or from an edge function

-- Alternative: Create a trigger that checks on subscription updates
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If subscription is being marked as inactive or has expired
  IF (NEW.is_active = false OR NEW.subscription_end < now()) THEN
    -- Unverify the celebrity
    UPDATE celebrity_profiles
    SET is_verified = false
    WHERE id = NEW.celebrity_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_check_subscription_expiry ON celebrity_subscriptions;

-- Create trigger on celebrity_subscriptions
CREATE TRIGGER trigger_check_subscription_expiry
AFTER UPDATE ON celebrity_subscriptions
FOR EACH ROW
EXECUTE FUNCTION check_subscription_expiry();