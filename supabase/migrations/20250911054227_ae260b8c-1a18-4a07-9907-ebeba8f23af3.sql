-- Add view tracking and likes functionality
CREATE TABLE IF NOT EXISTS public.video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES celebrity_media(id) ON DELETE CASCADE,
  user_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES celebrity_media(id) ON DELETE CASCADE,
  user_ip TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_ip)
);

-- Enable RLS
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_views
CREATE POLICY "Anyone can view video views" 
ON public.video_views 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can record video views" 
ON public.video_views 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for video_likes
CREATE POLICY "Anyone can view video likes" 
ON public.video_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can like videos" 
ON public.video_likes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can remove their likes" 
ON public.video_likes 
FOR DELETE 
USING (true);

-- Add indexes for performance
CREATE INDEX idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX idx_video_likes_user_ip ON public.video_likes(user_ip);