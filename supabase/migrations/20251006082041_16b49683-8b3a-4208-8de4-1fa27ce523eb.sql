-- Remove temporary development policies that might conflict
DROP POLICY IF EXISTS "Development admin full access" ON celebrity_subscriptions;
DROP POLICY IF EXISTS "Development: Allow authenticated users to view payments" ON payment_verification;

-- Ensure admin_users table has RLS enabled but with proper policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow admins to read admin_users table to verify their own status
DROP POLICY IF EXISTS "Admins can read admin users" ON admin_users;
CREATE POLICY "Admins can read admin users" ON admin_users
FOR SELECT USING (is_current_user_admin());