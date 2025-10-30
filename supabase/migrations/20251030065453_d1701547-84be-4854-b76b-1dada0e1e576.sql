-- Add country field to celebrity_profiles for global scaling
ALTER TABLE public.celebrity_profiles 
ADD COLUMN country TEXT;

-- Add index for faster country filtering
CREATE INDEX idx_celebrity_profiles_country ON public.celebrity_profiles(country);

-- Create a table to store available countries dynamically
CREATE TABLE public.available_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  is_east_africa BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on available_countries
ALTER TABLE public.available_countries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read countries
CREATE POLICY "Anyone can view countries"
ON public.available_countries
FOR SELECT
USING (true);

-- Only admins can manage countries
CREATE POLICY "Admins can manage countries"
ON public.available_countries
FOR ALL
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- Insert default East African countries
INSERT INTO public.available_countries (country_name, is_east_africa) VALUES
  ('Kenya', true),
  ('Uganda', true),
  ('Tanzania', true),
  ('Rwanda', true),
  ('Burundi', true),
  ('South Sudan', true),
  ('Ethiopia', true),
  ('Somalia', true)
ON CONFLICT (country_name) DO NOTHING;

-- Function to automatically add new countries when celebrities register
CREATE OR REPLACE FUNCTION public.add_country_if_new()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.country IS NOT NULL AND NEW.country != '' THEN
    INSERT INTO public.available_countries (country_name, is_east_africa)
    VALUES (NEW.country, false)
    ON CONFLICT (country_name) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to add new countries automatically
CREATE TRIGGER on_celebrity_country_change
  AFTER INSERT OR UPDATE OF country ON public.celebrity_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.add_country_if_new();