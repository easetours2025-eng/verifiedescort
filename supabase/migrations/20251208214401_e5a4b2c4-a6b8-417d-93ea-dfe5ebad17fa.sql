-- Add geolocation columns to app_installations
ALTER TABLE public.app_installations 
ADD COLUMN IF NOT EXISTS user_latitude double precision,
ADD COLUMN IF NOT EXISTS user_longitude double precision,
ADD COLUMN IF NOT EXISTS user_city text,
ADD COLUMN IF NOT EXISTS user_region text,
ADD COLUMN IF NOT EXISTS user_country_name text,
ADD COLUMN IF NOT EXISTS location_permission_granted boolean DEFAULT false;

-- Add geolocation columns to whatsapp_clicks
ALTER TABLE public.whatsapp_clicks 
ADD COLUMN IF NOT EXISTS user_latitude double precision,
ADD COLUMN IF NOT EXISTS user_longitude double precision,
ADD COLUMN IF NOT EXISTS user_city text,
ADD COLUMN IF NOT EXISTS user_region text,
ADD COLUMN IF NOT EXISTS user_country_name text;

-- Add geolocation columns to call_clicks
ALTER TABLE public.call_clicks 
ADD COLUMN IF NOT EXISTS user_latitude double precision,
ADD COLUMN IF NOT EXISTS user_longitude double precision,
ADD COLUMN IF NOT EXISTS user_city text,
ADD COLUMN IF NOT EXISTS user_region text,
ADD COLUMN IF NOT EXISTS user_country_name text;

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_app_installations_location ON app_installations(user_city, user_region);
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_location ON whatsapp_clicks(user_city, user_region);
CREATE INDEX IF NOT EXISTS idx_call_clicks_location ON call_clicks(user_city, user_region);