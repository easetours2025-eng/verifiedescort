-- Create storage buckets for celebrity media
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('celebrity-photos', 'celebrity-photos', true),
  ('celebrity-videos', 'celebrity-videos', true);

-- Create celebrity profiles table
CREATE TABLE public.celebrity_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  real_name TEXT,
  bio TEXT,
  phone_number TEXT,
  email TEXT,
  location TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  social_instagram TEXT,
  social_twitter TEXT,
  social_tiktok TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create media table for celebrity photos/videos
CREATE TABLE public.celebrity_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  celebrity_id UUID NOT NULL REFERENCES public.celebrity_profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  title TEXT,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.celebrity_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebrity_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for celebrity_profiles
CREATE POLICY "Anyone can view public celebrity profiles" 
ON public.celebrity_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own celebrity profile" 
ON public.celebrity_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own celebrity profile" 
ON public.celebrity_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own celebrity profile" 
ON public.celebrity_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for celebrity_media
CREATE POLICY "Anyone can view public celebrity media" 
ON public.celebrity_media 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Celebrity can manage their own media" 
ON public.celebrity_media 
FOR ALL 
USING (
  celebrity_id IN (
    SELECT id FROM public.celebrity_profiles WHERE user_id = auth.uid()
  )
);

-- Storage policies for celebrity photos
CREATE POLICY "Anyone can view celebrity photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'celebrity-photos');

CREATE POLICY "Authenticated users can upload celebrity photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'celebrity-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own celebrity photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'celebrity-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own celebrity photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'celebrity-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for celebrity videos
CREATE POLICY "Anyone can view celebrity videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'celebrity-videos');

CREATE POLICY "Authenticated users can upload celebrity videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'celebrity-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own celebrity videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'celebrity-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own celebrity videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'celebrity-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_celebrity_profiles_updated_at
BEFORE UPDATE ON public.celebrity_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.celebrity_profiles (user_id, stage_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'stage_name', 'New Celebrity'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();