-- Create logging table for sitemap monitoring
CREATE TABLE IF NOT EXISTS public.sitemap_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  trigger_reason TEXT,
  celebrity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate limiting table for search engine pings
CREATE TABLE IF NOT EXISTS public.search_engine_pings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_ping_at TIMESTAMP WITH TIME ZONE,
  ping_count INTEGER DEFAULT 0,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial row for rate limiting
INSERT INTO public.search_engine_pings (id, last_ping_at, ping_count)
VALUES (1, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_sitemap_update ON public.celebrity_profiles;

-- Create improved function to invalidate sitemap cache on profile changes
CREATE OR REPLACE FUNCTION public.invalidate_sitemap_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Only invalidate for significant changes
  IF (TG_OP = 'INSERT' AND NEW.is_verified = true AND NEW.is_available = true) OR
     (TG_OP = 'UPDATE' AND (
       OLD.is_verified != NEW.is_verified OR
       OLD.is_available != NEW.is_available OR
       OLD.stage_name != NEW.stage_name OR
       OLD.profile_picture_path != NEW.profile_picture_path OR
       OLD.phone_number != NEW.phone_number
     )) OR
     (TG_OP = 'DELETE' AND OLD.is_verified = true) THEN
    
    -- Delete the cached sitemap to force regeneration
    DELETE FROM public.sitemap_cache WHERE id = 1;
    
    -- Log the invalidation event
    INSERT INTO public.sitemap_logs (action, trigger_reason, celebrity_id)
    VALUES ('cache_invalidated', TG_OP, COALESCE(NEW.id, OLD.id));
    
    -- Notify about sitemap update
    PERFORM pg_notify('sitemap_update', COALESCE(NEW.id::text, OLD.id::text));
    
    -- Rate-limited search engine ping (max once per hour)
    DECLARE
      last_ping TIMESTAMP WITH TIME ZONE;
    BEGIN
      SELECT last_ping_at INTO last_ping FROM public.search_engine_pings WHERE id = 1;
      
      IF last_ping IS NULL OR (NOW() - last_ping) > INTERVAL '1 hour' THEN
        -- Update ping timestamp
        UPDATE public.search_engine_pings 
        SET last_ping_at = NOW(), ping_count = ping_count + 1 
        WHERE id = 1;
        
        -- Ping search engines asynchronously (non-blocking)
        BEGIN
          PERFORM public.ping_search_engines();
        EXCEPTION WHEN OTHERS THEN
          -- Log error but don't fail the transaction
          INSERT INTO public.sitemap_logs (action, trigger_reason, celebrity_id)
          VALUES ('ping_failed', SQLERRM, COALESCE(NEW.id, OLD.id));
        END;
      END IF;
    END;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic sitemap cache invalidation
CREATE TRIGGER trigger_invalidate_sitemap_cache
AFTER INSERT OR UPDATE OR DELETE ON public.celebrity_profiles
FOR EACH ROW
EXECUTE FUNCTION public.invalidate_sitemap_cache();

-- Enable RLS on sitemap_logs
ALTER TABLE public.sitemap_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view sitemap logs
CREATE POLICY "Admins can view sitemap logs"
ON public.sitemap_logs
FOR SELECT
TO authenticated
USING (public.is_user_admin());

-- Allow system to insert logs
CREATE POLICY "System can insert sitemap logs"
ON public.sitemap_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable RLS on search_engine_pings
ALTER TABLE public.search_engine_pings ENABLE ROW LEVEL SECURITY;

-- Allow admins to view ping status
CREATE POLICY "Admins can view search engine pings"
ON public.search_engine_pings
FOR SELECT
TO authenticated
USING (public.is_user_admin());

-- Allow system to update ping records
CREATE POLICY "System can update search engine pings"
ON public.search_engine_pings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);