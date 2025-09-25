-- Create media_views table for tracking views on both images and videos
CREATE TABLE public.media_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL,
  user_ip TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create media_likes table for tracking likes on both images and videos  
CREATE TABLE public.media_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL,
  user_ip TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  like_type TEXT NOT NULL DEFAULT 'like' CHECK (like_type IN ('like', 'love')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(media_id, user_ip, user_id, like_type)
);

-- Enable Row Level Security
ALTER TABLE public.media_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for media_views
CREATE POLICY "Anyone can view media views" 
ON public.media_views 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can record media views" 
ON public.media_views 
FOR INSERT 
WITH CHECK (true);

-- Create policies for media_likes  
CREATE POLICY "Anyone can view media likes" 
ON public.media_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can like media" 
ON public.media_likes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can remove their likes" 
ON public.media_likes 
FOR DELETE 
USING (true);

-- Add foreign key relationships to celebrity_media
ALTER TABLE public.media_views 
ADD CONSTRAINT media_views_media_id_fkey 
FOREIGN KEY (media_id) 
REFERENCES public.celebrity_media(id) 
ON DELETE CASCADE;

ALTER TABLE public.media_likes 
ADD CONSTRAINT media_likes_media_id_fkey 
FOREIGN KEY (media_id) 
REFERENCES public.celebrity_media(id) 
ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_media_views_media_id ON public.media_views(media_id);
CREATE INDEX idx_media_views_created_at ON public.media_views(created_at);
CREATE INDEX idx_media_likes_media_id ON public.media_likes(media_id);
CREATE INDEX idx_media_likes_type ON public.media_likes(like_type);