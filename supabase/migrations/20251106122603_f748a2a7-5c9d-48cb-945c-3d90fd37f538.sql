-- Create sitemap cache table
CREATE TABLE IF NOT EXISTS public.sitemap_cache (
  id INTEGER PRIMARY KEY,
  sitemap_xml TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS but allow public read
ALTER TABLE public.sitemap_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to sitemap cache"
ON public.sitemap_cache
FOR SELECT
USING (true);

-- Create function to ping search engines
CREATE OR REPLACE FUNCTION public.ping_search_engines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
BEGIN
  supabase_url := 'https://kpjqcrhoablsllkgonbl.supabase.co';
  
  -- Call the edge function to ping search engines
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/ping-search-engines',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to ping search engines: %', SQLERRM;
END;
$$;

-- Create trigger function for celebrity profile changes
CREATE OR REPLACE FUNCTION public.trigger_sitemap_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only ping search engines for significant changes
  IF (TG_OP = 'INSERT' AND NEW.is_verified = true) OR
     (TG_OP = 'UPDATE' AND (
       OLD.is_verified != NEW.is_verified OR
       OLD.is_available != NEW.is_available OR
       OLD.stage_name != NEW.stage_name OR
       OLD.profile_picture_path != NEW.profile_picture_path
     )) THEN
    
    -- Perform async to not block the main operation
    PERFORM pg_notify('sitemap_update', NEW.id::text);
    
    -- Try to ping search engines (non-blocking)
    BEGIN
      PERFORM public.ping_search_engines();
    EXCEPTION WHEN OTHERS THEN
      -- Silently fail to not block celebrity profile updates
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on celebrity_profiles
DROP TRIGGER IF EXISTS celebrity_profile_sitemap_update ON public.celebrity_profiles;
CREATE TRIGGER celebrity_profile_sitemap_update
AFTER INSERT OR UPDATE ON public.celebrity_profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_sitemap_update();

-- Create index for better cache performance
CREATE INDEX IF NOT EXISTS idx_sitemap_cache_created_at ON public.sitemap_cache(created_at DESC);
