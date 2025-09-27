-- Create admin video likes table
CREATE TABLE public.admin_video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.admin_videos(id) ON DELETE CASCADE,
  user_ip TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for admin video likes
ALTER TABLE public.admin_video_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for admin video likes
CREATE POLICY "Anyone can like admin videos" 
ON public.admin_video_likes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view admin video likes" 
ON public.admin_video_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can remove their admin video likes" 
ON public.admin_video_likes 
FOR DELETE 
USING (true);

-- Update admin_videos table to make title and description optional
ALTER TABLE public.admin_videos 
ALTER COLUMN title DROP NOT NULL,
ALTER COLUMN title SET DEFAULT 'Untitled Video';