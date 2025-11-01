-- Update the free trial activation function to show KES 1150 for the 1-week VIP Elite offer
CREATE OR REPLACE FUNCTION public.activate_free_trial_on_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_active_sub boolean;
  trial_start timestamp with time zone;
  trial_end timestamp with time zone;
BEGIN
  -- Check if all required fields are now filled
  IF NEW.stage_name IS NOT NULL 
     AND NEW.phone_number IS NOT NULL 
     AND NEW.phone_number != ''
     AND NEW.profile_picture_path IS NOT NULL 
     AND NEW.profile_picture_path != ''
     AND NEW.age IS NOT NULL
     AND NEW.gender IS NOT NULL
     AND array_length(NEW.gender, 1) > 0
     AND NEW.location IS NOT NULL 
     AND NEW.location != ''
     AND NEW.bio IS NOT NULL 
     AND NEW.bio != ''
  THEN
    -- Check if user already has an active subscription or had a free trial
    SELECT EXISTS (
      SELECT 1 FROM celebrity_subscriptions 
      WHERE celebrity_id = NEW.id
    ) INTO has_active_sub;
    
    -- If no subscription exists yet, create the free trial
    IF NOT has_active_sub THEN
      trial_start := NOW();
      trial_end := NOW() + INTERVAL '7 days';
      
      -- Create VIP Elite subscription for 1 week with KES 1150 value
      INSERT INTO celebrity_subscriptions (
        celebrity_id,
        subscription_tier,
        duration_type,
        subscription_start,
        subscription_end,
        is_active,
        amount_paid
      ) VALUES (
        NEW.id,
        'vip_elite',
        '1_week',
        trial_start,
        trial_end,
        true,
        1150  -- KES 1150 for 1 week VIP Elite offer
      );
      
      -- Create a verified payment record for tracking with KES 1150
      INSERT INTO payment_verification (
        celebrity_id,
        phone_number,
        mpesa_code,
        amount,
        expected_amount,
        subscription_tier,
        duration_type,
        payment_type,
        payment_status,
        is_verified,
        verified_at,
        payment_date
      ) VALUES (
        NEW.id,
        NEW.phone_number,
        'FREE_TRIAL_' || NEW.id::text,
        1150,  -- KES 1150
        1150,  -- Expected amount
        'vip_elite',
        '1_week',
        'free_trial',
        'completed',
        true,
        NOW(),
        NOW()
      );
      
      -- Mark profile as verified and available
      NEW.is_verified := true;
      NEW.is_available := true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;