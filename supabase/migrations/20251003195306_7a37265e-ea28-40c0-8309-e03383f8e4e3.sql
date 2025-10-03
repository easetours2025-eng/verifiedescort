-- Add price column to celebrity_services table
ALTER TABLE celebrity_services 
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

-- Fix admin video upload by ensuring file_path stores path, not full URL
-- Also update RLS policies to allow authenticated admins to upload

-- Ensure storage policies for admin-videos bucket allow admin uploads
DROP POLICY IF EXISTS "Admins can upload admin videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update admin videos" ON storage.objects;

CREATE POLICY "Admins can upload admin videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-videos' 
  AND is_admin_access()
);

CREATE POLICY "Admins can update admin videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'admin-videos'
  AND is_admin_access()
)
WITH CHECK (
  bucket_id = 'admin-videos'
  AND is_admin_access()
);

-- Ensure celebrity-photos bucket allows celebrity uploads
DROP POLICY IF EXISTS "Celebrities can upload their photos" ON storage.objects;
DROP POLICY IF EXISTS "Celebrities can update their photos" ON storage.objects;

CREATE POLICY "Celebrities can upload their photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'celebrity-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM celebrity_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Celebrities can update their photos"
ON storage.objects  
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'celebrity-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM celebrity_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'celebrity-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM celebrity_profiles WHERE user_id = auth.uid()
  )
);