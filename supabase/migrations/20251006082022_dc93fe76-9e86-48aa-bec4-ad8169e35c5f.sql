-- Fix RLS policies to use security definer function instead of direct auth.users access

-- Update payment_verification policies
DROP POLICY IF EXISTS "Admins can update payment verification" ON payment_verification;
DROP POLICY IF EXISTS "Admins can create payment verifications" ON payment_verification;
DROP POLICY IF EXISTS "Admins can view payment verifications" ON payment_verification;

CREATE POLICY "Admins can update payment verification" ON payment_verification
FOR UPDATE USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can create payment verifications" ON payment_verification
FOR INSERT WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can view payment verifications" ON payment_verification
FOR SELECT USING (is_current_user_admin());

-- Update celebrity_subscriptions policies
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON celebrity_subscriptions;

CREATE POLICY "Admins can manage all subscriptions" ON celebrity_subscriptions
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Update celebrity_profiles policies
DROP POLICY IF EXISTS "Admins can update celebrity profiles" ON celebrity_profiles;

CREATE POLICY "Admins can update celebrity profiles" ON celebrity_profiles
FOR UPDATE USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can manage all celebrity profiles" ON celebrity_profiles
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());