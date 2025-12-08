-- Add device_fingerprint column to tracking tables
ALTER TABLE public.app_installations 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

ALTER TABLE public.call_clicks 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

ALTER TABLE public.whatsapp_clicks 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Add index for efficient fingerprint lookups
CREATE INDEX IF NOT EXISTS idx_app_installations_fingerprint ON public.app_installations(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_call_clicks_fingerprint ON public.call_clicks(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_fingerprint ON public.whatsapp_clicks(device_fingerprint);