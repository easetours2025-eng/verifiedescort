-- Create storage policies for admin video uploads
-- Allow authenticated users to upload to admin-videos bucket
CREATE POLICY "Admin users can upload videos to admin-videos bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'admin-videos' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to read from admin-videos bucket
CREATE POLICY "Admin users can view videos in admin-videos bucket" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'admin-videos' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update videos in admin-videos bucket
CREATE POLICY "Admin users can update videos in admin-videos bucket" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'admin-videos' 
  AND auth.role() = 'authenticated'
) 
WITH CHECK (
  bucket_id = 'admin-videos' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete videos in admin-videos bucket
CREATE POLICY "Admin users can delete videos in admin-videos bucket" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'admin-videos' 
  AND auth.role() = 'authenticated'
);