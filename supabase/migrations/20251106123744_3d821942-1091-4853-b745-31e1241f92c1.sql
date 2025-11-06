-- Create celebrity reviews table
CREATE TABLE IF NOT EXISTS public.celebrity_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id UUID NOT NULL REFERENCES public.celebrity_profiles(id) ON DELETE CASCADE,
  user_ip TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.celebrity_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view verified reviews"
ON public.celebrity_reviews
FOR SELECT
USING (is_verified = true);

CREATE POLICY "Anyone can submit reviews"
ON public.celebrity_reviews
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all reviews"
ON public.celebrity_reviews
FOR ALL
USING (is_user_admin())
WITH CHECK (is_user_admin());

-- Create index for better performance
CREATE INDEX idx_celebrity_reviews_celebrity_id ON public.celebrity_reviews(celebrity_id);
CREATE INDEX idx_celebrity_reviews_verified ON public.celebrity_reviews(is_verified) WHERE is_verified = true;

-- Create function to get aggregate rating for a celebrity
CREATE OR REPLACE FUNCTION public.get_celebrity_rating(celebrity_profile_id UUID)
RETURNS TABLE(
  average_rating NUMERIC,
  total_reviews BIGINT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROUND(AVG(rating)::NUMERIC, 1) as average_rating,
    COUNT(*)::BIGINT as total_reviews
  FROM celebrity_reviews
  WHERE celebrity_id = celebrity_profile_id
    AND is_verified = true;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_celebrity_reviews_updated_at
BEFORE UPDATE ON public.celebrity_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();