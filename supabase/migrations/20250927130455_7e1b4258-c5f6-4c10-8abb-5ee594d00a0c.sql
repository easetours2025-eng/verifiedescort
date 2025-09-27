-- Fix IP address exposure in likes tables
-- This addresses the security vulnerability where user IP addresses are publicly accessible

-- 1. Fix admin_video_likes table - restrict public access to IP data
DROP POLICY IF EXISTS "Anyone can view admin video likes" ON admin_video_likes;

CREATE POLICY "Public can view admin video like counts only"
ON admin_video_likes
FOR SELECT
USING (false); -- Block direct access to raw data with IPs

-- 2. Fix media_likes table - same issue exists there
DROP POLICY IF EXISTS "Anyone can view media likes" ON media_likes;

CREATE POLICY "Public can view media like counts only"
ON media_likes  
FOR SELECT
USING (false); -- Block direct access to raw data with IPs

-- 3. Fix video_likes table - same issue exists there  
DROP POLICY IF EXISTS "Anyone can view video likes" ON video_likes;

CREATE POLICY "Public can view video like counts only"
ON video_likes
FOR SELECT  
USING (false); -- Block direct access to raw data with IPs

-- 4. Create safe functions for getting like counts without exposing IP addresses

-- Function for admin video like counts
CREATE OR REPLACE FUNCTION public.get_admin_video_like_count(video_uuid uuid)
RETURNS bigint
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::bigint
  FROM admin_video_likes 
  WHERE video_id = video_uuid;
$$;

-- Function for media like counts  
CREATE OR REPLACE FUNCTION public.get_media_like_count(media_uuid uuid)
RETURNS bigint
LANGUAGE SQL
STABLE SECURITY DEFINER  
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::bigint
  FROM media_likes
  WHERE media_id = media_uuid;
$$;

-- Function for video like counts
CREATE OR REPLACE FUNCTION public.get_video_like_count(video_uuid uuid) 
RETURNS bigint
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public' 
AS $$
  SELECT COUNT(*)::bigint
  FROM video_likes
  WHERE video_id = video_uuid;
$$;

-- Function to check if user has liked admin video (without exposing IPs)
CREATE OR REPLACE FUNCTION public.has_user_liked_admin_video(video_uuid uuid, user_ip_param text)
RETURNS boolean
LANGUAGE SQL  
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_video_likes 
    WHERE video_id = video_uuid AND user_ip = user_ip_param
  );
$$;

-- Function to check if user has liked media (without exposing IPs)  
CREATE OR REPLACE FUNCTION public.has_user_liked_media(media_uuid uuid, user_ip_param text)
RETURNS boolean
LANGUAGE SQL
STABLE SECURITY DEFINER  
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM media_likes
    WHERE media_id = media_uuid AND user_ip = user_ip_param  
  );
$$;

-- Function to check if user has liked video (without exposing IPs)
CREATE OR REPLACE FUNCTION public.has_user_liked_video(video_uuid uuid, user_ip_param text)  
RETURNS boolean
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM video_likes 
    WHERE video_id = video_uuid AND user_ip = user_ip_param
  );
$$;

-- Grant execute permissions on the safe functions
GRANT EXECUTE ON FUNCTION public.get_admin_video_like_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_media_like_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_video_like_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_liked_admin_video(uuid, text) TO anon, authenticated;  
GRANT EXECUTE ON FUNCTION public.has_user_liked_media(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_liked_video(uuid, text) TO anon, authenticated;