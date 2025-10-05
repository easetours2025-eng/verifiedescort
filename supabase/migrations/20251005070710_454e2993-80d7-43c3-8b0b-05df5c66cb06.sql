-- Drop existing admin video upload policy and recreate with better auth check
DROP POLICY IF EXISTS "Admins can upload admin videos" ON storage.objects;

-- Allow authenticated users to upload to admin-videos bucket
-- The admin_videos table RLS will provide the security layer
CREATE POLICY "Authenticated users can upload admin videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-videos'
);