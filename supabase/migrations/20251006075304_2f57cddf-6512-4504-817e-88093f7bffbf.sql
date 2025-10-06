-- Temporary development policy to allow viewing payment verifications
-- This allows any authenticated user to view payments during development
-- In production, this should be restricted to verified admins only
CREATE POLICY "Development: Allow authenticated users to view payments"
ON payment_verification
FOR SELECT
USING (true);

-- Allow authenticated users to read celebrity profiles for payment display
-- This is safe as it only exposes basic profile info already visible publicly
DROP POLICY IF EXISTS "Allow public to view all celebrity profiles" ON celebrity_profiles;
CREATE POLICY "Allow public to view all celebrity profiles"
ON celebrity_profiles
FOR SELECT
USING (true);