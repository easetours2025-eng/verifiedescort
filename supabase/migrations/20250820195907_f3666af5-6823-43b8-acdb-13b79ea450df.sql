-- Fix function search path for security
CREATE OR REPLACE FUNCTION public.is_celebrity_subscription_active(celebrity_profile_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM celebrity_subscriptions 
    WHERE celebrity_id = celebrity_profile_id 
    AND is_active = true 
    AND subscription_end > now()
  );
END;
$$;