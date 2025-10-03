-- Fix admin_videos RLS policy for INSERT
DROP POLICY IF EXISTS "Allow admin uploads" ON admin_videos;

CREATE POLICY "Allow admin uploads"
ON admin_videos
FOR INSERT
TO authenticated
WITH CHECK (is_admin_access());

-- Add storage policies for admin-videos bucket
DROP POLICY IF EXISTS "Admins can upload admin videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view admin videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete admin videos" ON storage.objects;

CREATE POLICY "Admins can upload admin videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-videos' 
  AND is_admin_access()
);

CREATE POLICY "Anyone can view admin videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'admin-videos');

CREATE POLICY "Admins can delete admin videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-videos'
  AND is_admin_access()
);