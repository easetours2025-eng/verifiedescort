-- Drop existing restrictive INSERT policies for admin-videos bucket
DROP POLICY IF EXISTS "Admin can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can upload videos to admin-videos bucket" ON storage.objects;

-- Create a simple public INSERT policy for admin-videos bucket
CREATE POLICY "Public can upload to admin-videos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'admin-videos');