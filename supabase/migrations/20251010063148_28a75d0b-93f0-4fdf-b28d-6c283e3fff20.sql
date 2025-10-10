-- Create profile_views table to track celebrity profile page views
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id UUID NOT NULL REFERENCES public.celebrity_profiles(id) ON DELETE CASCADE,
  user_ip TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can record profile views
CREATE POLICY "Anyone can record profile views"
ON public.profile_views
FOR INSERT
WITH CHECK (true);

-- Policy: Celebrities can view their own profile stats
CREATE POLICY "Celebrities can view their own profile views"
ON public.profile_views
FOR SELECT
USING (
  celebrity_id IN (
    SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can view all profile views
CREATE POLICY "Admins can view all profile views"
ON public.profile_views
FOR SELECT
USING (is_current_user_admin());

-- Create index for better performance
CREATE INDEX idx_profile_views_celebrity_id ON public.profile_views(celebrity_id);
CREATE INDEX idx_profile_views_created_at ON public.profile_views(created_at);

-- Function to get profile view count
CREATE OR REPLACE FUNCTION public.get_profile_view_count(profile_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::BIGINT
  FROM profile_views
  WHERE celebrity_id = profile_id;
$$;