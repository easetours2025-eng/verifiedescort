-- Allow public read access to celebrity profiles
-- This enables all users to view celebrity profiles on the homepage

CREATE POLICY "Allow public to view all celebrity profiles"
ON public.celebrity_profiles
FOR SELECT
TO anon, authenticated
USING (true);