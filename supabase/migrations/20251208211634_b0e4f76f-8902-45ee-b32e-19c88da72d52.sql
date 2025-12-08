-- Add device tracking columns to call_clicks
ALTER TABLE public.call_clicks
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS browser_name text,
ADD COLUMN IF NOT EXISTS os_name text,
ADD COLUMN IF NOT EXISTS platform text,
ADD COLUMN IF NOT EXISTS is_mobile boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS screen_width integer,
ADD COLUMN IF NOT EXISTS screen_height integer;

-- Add device tracking columns to whatsapp_clicks
ALTER TABLE public.whatsapp_clicks
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS browser_name text,
ADD COLUMN IF NOT EXISTS os_name text,
ADD COLUMN IF NOT EXISTS platform text,
ADD COLUMN IF NOT EXISTS is_mobile boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS screen_width integer,
ADD COLUMN IF NOT EXISTS screen_height integer;