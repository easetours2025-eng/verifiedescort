-- Create table to track app installations
CREATE TABLE public.app_installations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_ip TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  os_version TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  platform TEXT,
  language TEXT,
  timezone TEXT,
  is_mobile BOOLEAN DEFAULT false,
  is_tablet BOOLEAN DEFAULT false,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  referral_code TEXT
);

-- Enable RLS
ALTER TABLE public.app_installations ENABLE ROW LEVEL SECURITY;

-- Only admins can view all installations
CREATE POLICY "Admins can view all app installations"
  ON public.app_installations
  FOR SELECT
  USING (is_user_admin());

-- Anyone can insert (to track their own installation)
CREATE POLICY "Anyone can record app installations"
  ON public.app_installations
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_app_installations_installed_at ON public.app_installations(installed_at DESC);
CREATE INDEX idx_app_installations_user_ip ON public.app_installations(user_ip);