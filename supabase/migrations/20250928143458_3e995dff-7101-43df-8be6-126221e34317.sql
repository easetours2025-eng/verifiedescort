-- Fix Security Definer View issue by recreating views with proper security barriers
-- and ensuring they respect RLS policies from underlying tables

-- Drop and recreate the public_celebrity_profiles view with security barrier
DROP VIEW IF EXISTS public.public_celebrity_profiles;

CREATE VIEW public.public_celebrity_profiles 
WITH (security_barrier = true) AS
SELECT 
  id,
  stage_name,
  bio,
  profile_picture_path,
  base_price,
  hourly_rate,
  is_verified,
  is_available,
  location,
  gender,
  social_instagram,
  social_twitter,
  social_tiktok,
  age,
  created_at,
  updated_at
FROM celebrity_profiles
WHERE is_available = true;

-- Recreate statistics views with security barriers to ensure proper access control
DROP VIEW IF EXISTS public.video_stats;
CREATE VIEW public.video_stats 
WITH (security_barrier = true) AS
SELECT 
  video_id,
  count(*) AS view_count,
  date_trunc('day', created_at) AS view_date
FROM video_views
GROUP BY video_id, date_trunc('day', created_at);

DROP VIEW IF EXISTS public.media_stats;
CREATE VIEW public.media_stats 
WITH (security_barrier = true) AS
SELECT 
  media_id,
  count(*) AS view_count,
  date_trunc('day', created_at) AS view_date
FROM media_views
GROUP BY media_id, date_trunc('day', created_at);

DROP VIEW IF EXISTS public.admin_video_stats;
CREATE VIEW public.admin_video_stats 
WITH (security_barrier = true) AS
SELECT 
  video_id,
  count(*) AS view_count,
  date_trunc('day', created_at) AS view_date
FROM admin_video_views
GROUP BY video_id, date_trunc('day', created_at);