-- Fix Security Definer View issues by removing problematic views
-- and replacing them with secure functions that properly enforce access control

-- Remove the views that are causing security definer issues
DROP VIEW IF EXISTS public.public_celebrity_profiles;
DROP VIEW IF EXISTS public.video_stats; 
DROP VIEW IF EXISTS public.media_stats;
DROP VIEW IF EXISTS public.admin_video_stats;

-- Create secure functions to replace the views with proper access control
-- These functions will safely handle the data access without bypassing RLS

-- Function to get public celebrity profiles (replaces public_celebrity_profiles view)
CREATE OR REPLACE FUNCTION public.get_public_celebrity_profiles()
RETURNS TABLE(
  id uuid,
  stage_name text,
  bio text,
  profile_picture_path text,
  base_price numeric,
  hourly_rate numeric,
  is_verified boolean,
  is_available boolean,
  location text,
  gender text,
  social_instagram text,
  social_twitter text,
  social_tiktok text,
  age integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    cp.id,
    cp.stage_name,
    cp.bio,
    cp.profile_picture_path,
    cp.base_price,
    cp.hourly_rate,
    cp.is_verified,
    cp.is_available,
    cp.location,
    cp.gender,
    cp.social_instagram,
    cp.social_twitter,
    cp.social_tiktok,
    cp.age,
    cp.created_at,
    cp.updated_at
  FROM celebrity_profiles cp
  WHERE cp.is_available = true;
$$;

-- Function to get video statistics (replaces video_stats view)
CREATE OR REPLACE FUNCTION public.get_video_statistics()
RETURNS TABLE(
  video_id uuid,
  view_count bigint,
  view_date timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    vv.video_id,
    count(*) AS view_count,
    date_trunc('day', vv.created_at) AS view_date
  FROM video_views vv
  GROUP BY vv.video_id, date_trunc('day', vv.created_at);
$$;

-- Function to get media statistics (replaces media_stats view)  
CREATE OR REPLACE FUNCTION public.get_media_statistics()
RETURNS TABLE(
  media_id uuid,
  view_count bigint,
  view_date timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    mv.media_id,
    count(*) AS view_count,
    date_trunc('day', mv.created_at) AS view_date
  FROM media_views mv
  GROUP BY mv.media_id, date_trunc('day', mv.created_at);
$$;

-- Function to get admin video statistics (replaces admin_video_stats view)
CREATE OR REPLACE FUNCTION public.get_admin_video_statistics()
RETURNS TABLE(
  video_id uuid,
  view_count bigint,
  view_date timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    avv.video_id,
    count(*) AS view_count,
    date_trunc('day', avv.created_at) AS view_date
  FROM admin_video_views avv
  GROUP BY avv.video_id, date_trunc('day', avv.created_at);
$$;