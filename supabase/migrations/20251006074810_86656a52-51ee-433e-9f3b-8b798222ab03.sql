-- Add tracking columns to payment verification
ALTER TABLE payment_verification 
ADD COLUMN IF NOT EXISTS subscription_tier text,
ADD COLUMN IF NOT EXISTS duration_type text;

-- Update RLS policies to prevent modification of verified payments
DROP POLICY IF EXISTS "Admins can update payment verifications" ON payment_verification;
DROP POLICY IF EXISTS "Admins can delete payment verifications" ON payment_verification;

-- Only allow updates to unverified payments by superadmins
CREATE POLICY "Super admins can update unverified payments only"
ON payment_verification
FOR UPDATE
USING (
  is_verified = false 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_super_admin = true
  )
)
WITH CHECK (
  is_verified = false 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_super_admin = true
  )
);

-- Prevent deletion of verified payments, only superadmins can delete unverified ones
CREATE POLICY "Super admins can delete unverified payments only"
ON payment_verification
FOR DELETE
USING (
  is_verified = false 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_super_admin = true
  )
);

-- Create a function to get payment statistics (accessible to superadmins only)
CREATE OR REPLACE FUNCTION get_payment_statistics()
RETURNS TABLE (
  month timestamp with time zone,
  total_payments bigint,
  total_amount numeric,
  verified_payments bigint,
  verified_amount numeric,
  pending_payments bigint,
  pending_amount numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_payments,
    SUM(amount) FILTER (WHERE is_verified = true) as verified_amount,
    COUNT(*) FILTER (WHERE is_verified = false) as pending_payments,
    SUM(amount) FILTER (WHERE is_verified = false) as pending_amount
  FROM payment_verification
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY month DESC;
$$;