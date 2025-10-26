-- Create table for tracking WhatsApp button clicks
CREATE TABLE public.whatsapp_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  celebrity_id UUID NOT NULL,
  user_ip TEXT,
  user_id UUID,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.whatsapp_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to record WhatsApp clicks
CREATE POLICY "Anyone can record whatsapp clicks"
ON public.whatsapp_clicks
FOR INSERT
WITH CHECK (true);

-- Admins can view all WhatsApp clicks
CREATE POLICY "Admins can view all whatsapp clicks"
ON public.whatsapp_clicks
FOR SELECT
USING (is_current_user_admin());

-- Celebrities can view their own WhatsApp clicks
CREATE POLICY "Celebrities can view their own whatsapp clicks"
ON public.whatsapp_clicks
FOR SELECT
USING (
  celebrity_id IN (
    SELECT id FROM celebrity_profiles
    WHERE user_id = auth.uid()
  )
);

-- Create function to get WhatsApp click statistics
CREATE OR REPLACE FUNCTION public.get_whatsapp_click_statistics()
RETURNS TABLE(
  celebrity_id UUID,
  click_count BIGINT,
  click_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    wc.celebrity_id,
    COUNT(*) as click_count,
    DATE_TRUNC('day', wc.clicked_at) as click_date
  FROM whatsapp_clicks wc
  GROUP BY wc.celebrity_id, DATE_TRUNC('day', wc.clicked_at);
$function$;