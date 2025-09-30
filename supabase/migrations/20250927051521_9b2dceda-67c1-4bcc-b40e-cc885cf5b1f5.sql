-- Create admin videos table
CREATE TABLE public.admin_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration_seconds INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.admin_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for admin videos
CREATE POLICY "Anyone can view active admin videos" 
ON public.admin_videos 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage all admin videos" 
ON public.admin_videos 
FOR ALL 
USING (is_admin_access())
WITH CHECK (is_admin_access());

-- Create storage bucket for admin videos
INSERT INTO storage.buckets (id, name, public) VALUES ('admin-videos', 'admin-videos', true);

-- Create storage policies for admin videos
CREATE POLICY "Admin can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'admin-videos' AND is_admin_access());

CREATE POLICY "Admin can update videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'admin-videos' AND is_admin_access())
WITH CHECK (bucket_id = 'admin-videos' AND is_admin_access());

CREATE POLICY "Admin can delete videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'admin-videos' AND is_admin_access());

CREATE POLICY "Anyone can view admin videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'admin-videos');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_videos_updated_at
BEFORE UPDATE ON public.admin_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create video views tracking table
CREATE TABLE public.admin_video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.admin_videos(id) ON DELETE CASCADE,
  user_ip TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for video views
ALTER TABLE public.admin_video_views ENABLE ROW LEVEL SECURITY;

-- Create policies for video views
CREATE POLICY "Anyone can record video views" 
ON public.admin_video_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view video view stats" 
ON public.admin_video_views 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage video views" 
ON public.admin_video_views 
FOR ALL 
USING (is_admin_access())
WITH CHECK (is_admin_access());