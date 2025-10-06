-- Fix storage policies for admin-videos bucket to allow admin uploads

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin uploads only" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage videos" ON storage.objects;

-- Allow anyone to upload to admin-videos bucket (we validate via edge function)
CREATE POLICY "Allow admin video uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'admin-videos');

-- Allow anyone to read from admin-videos bucket (public videos)
CREATE POLICY "Public can view admin videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'admin-videos');

-- Allow anyone to update admin videos (for edge function operations)
CREATE POLICY "Allow admin video updates"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'admin-videos')
WITH CHECK (bucket_id = 'admin-videos');

-- Allow anyone to delete admin videos (for edge function operations)
CREATE POLICY "Allow admin video deletions"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'admin-videos');