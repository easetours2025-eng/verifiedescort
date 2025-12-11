
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image_path TEXT,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  tags TEXT[] DEFAULT '{}',
  author_name TEXT DEFAULT 'Admin',
  read_time_minutes INTEGER DEFAULT 5,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_publish_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_celebrity_stories table (2 per blog post)
CREATE TABLE public.blog_celebrity_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  celebrity_name TEXT NOT NULL,
  celebrity_page_url TEXT NOT NULL,
  celebrity_image_path TEXT,
  image_source TEXT,
  image_credit TEXT,
  caption TEXT,
  story_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_celebrity_stories_blog_id ON public.blog_celebrity_stories(blog_post_id);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_celebrity_stories ENABLE ROW LEVEL SECURITY;

-- RLS policies for blog_posts
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts FOR SELECT
USING (is_published = true AND (published_at IS NULL OR published_at <= now()));

CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts FOR ALL
USING (is_user_admin())
WITH CHECK (is_user_admin());

-- RLS policies for blog_celebrity_stories
CREATE POLICY "Anyone can view celebrity stories of published posts"
ON public.blog_celebrity_stories FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.blog_posts 
  WHERE id = blog_post_id 
  AND is_published = true 
  AND (published_at IS NULL OR published_at <= now())
));

CREATE POLICY "Admins can manage all celebrity stories"
ON public.blog_celebrity_stories FOR ALL
USING (is_user_admin())
WITH CHECK (is_user_admin());

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

-- Storage policies for blog images
CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND is_user_admin());

CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-images' AND is_user_admin());

CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images' AND is_user_admin());

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_celebrity_stories_updated_at
BEFORE UPDATE ON public.blog_celebrity_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
