-- Fix IP address exposure in admin_video_views table
-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view video view stats" ON public.admin_video_views;

-- Create a restricted policy that blocks public access to IP addresses
-- Public users can still insert views but cannot read IP data
CREATE POLICY "Public can view video stats without IP data" 
ON public.admin_video_views 
FOR SELECT 
USING (false); -- Block all direct public SELECT access

-- Create a view for public video statistics that excludes IP addresses
CREATE OR REPLACE VIEW public.admin_video_stats AS
SELECT 
  video_id,
  COUNT(*) as view_count,
  DATE_TRUNC('day', created_at) as view_date
FROM public.admin_video_views
GROUP BY video_id, DATE_TRUNC('day', created_at);

-- Allow public access to the stats view (no IP addresses exposed)
GRANT SELECT ON public.admin_video_stats TO anon;
GRANT SELECT ON public.admin_video_stats TO authenticated;

-- Also fix similar issues in other analytics tables that may contain IP addresses
-- Fix video_views table
DROP POLICY IF EXISTS "Anyone can view video views" ON public.video_views;

CREATE POLICY "Public can view video stats without IP data" 
ON public.video_views 
FOR SELECT 
USING (false); -- Block direct access to IP data

-- Create stats view for video_views
CREATE OR REPLACE VIEW public.video_stats AS
SELECT 
  video_id,
  COUNT(*) as view_count,
  DATE_TRUNC('day', created_at) as view_date
FROM public.video_views
GROUP BY video_id, DATE_TRUNC('day', created_at);

GRANT SELECT ON public.video_stats TO anon;
GRANT SELECT ON public.video_stats TO authenticated;

-- Fix media_views table 
DROP POLICY IF EXISTS "Anyone can view media views" ON public.media_views;

CREATE POLICY "Public can view media stats without IP data" 
ON public.media_views 
FOR SELECT 
USING (false); -- Block direct access to IP data

-- Create stats view for media_views
CREATE OR REPLACE VIEW public.media_stats AS
SELECT 
  media_id,
  COUNT(*) as view_count,
  DATE_TRUNC('day', created_at) as view_date
FROM public.media_views
GROUP BY media_id, DATE_TRUNC('day', created_at);

GRANT SELECT ON public.media_stats TO anon;
GRANT SELECT ON public.media_stats TO authenticated;