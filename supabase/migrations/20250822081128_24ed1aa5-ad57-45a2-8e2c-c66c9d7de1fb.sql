-- Drop existing admin policy that's too permissive
DROP POLICY IF EXISTS "Admin can manage all payments" ON payment_verification;

-- Create proper admin policy that checks the admin_users table
CREATE POLICY "Admin users can manage all payments" 
ON payment_verification 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = (
      SELECT email FROM auth.users 
      WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = (
      SELECT email FROM auth.users 
      WHERE id = auth.uid()
    )
  )
);

-- Also update the celebrity_subscriptions table to have proper admin access
DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON celebrity_subscriptions;

CREATE POLICY "Admin users can manage all subscriptions" 
ON celebrity_subscriptions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = (
      SELECT email FROM auth.users 
      WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = (
      SELECT email FROM auth.users 
      WHERE id = auth.uid()
    )
  )
);