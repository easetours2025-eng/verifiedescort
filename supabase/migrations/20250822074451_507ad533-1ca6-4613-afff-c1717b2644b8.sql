-- Add age field to celebrity profiles for 18+ verification
ALTER TABLE public.celebrity_profiles 
ADD COLUMN age INTEGER;

-- Add constraint to ensure age is 18 or above
ALTER TABLE public.celebrity_profiles 
ADD CONSTRAINT age_18_plus CHECK (age >= 18);

-- Create admin_users table for admin authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_super_admin BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to manage themselves
CREATE POLICY "Admin users can view themselves" 
ON public.admin_users 
FOR SELECT 
USING (auth.uid()::text = id::text OR is_super_admin = true);

-- Create celebrity_services table for services offered by celebrities
CREATE TABLE public.celebrity_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  celebrity_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.celebrity_services ENABLE ROW LEVEL SECURITY;

-- Create policies for celebrity services
CREATE POLICY "Anyone can view active celebrity services" 
ON public.celebrity_services 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Celebrities can manage their own services" 
ON public.celebrity_services 
FOR ALL 
USING (celebrity_id IN (
  SELECT celebrity_profiles.id
  FROM celebrity_profiles
  WHERE celebrity_profiles.user_id = auth.uid()
));

-- Add subscription_tier column to celebrity_subscriptions
ALTER TABLE public.celebrity_subscriptions 
ADD COLUMN subscription_tier TEXT DEFAULT 'basic',
ADD COLUMN amount_paid NUMERIC DEFAULT 2000;

-- Update existing subscriptions to have proper tier
UPDATE public.celebrity_subscriptions 
SET subscription_tier = 'basic', amount_paid = 2000 
WHERE subscription_tier IS NULL;

-- Add profile_picture_path to celebrity_profiles
ALTER TABLE public.celebrity_profiles 
ADD COLUMN profile_picture_path TEXT,
ADD COLUMN date_of_birth DATE;

-- Create trigger for updated_at on celebrity_services
CREATE TRIGGER update_celebrity_services_updated_at
BEFORE UPDATE ON public.celebrity_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add admin function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = user_email
  );
END;
$$;