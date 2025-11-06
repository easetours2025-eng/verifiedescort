-- Fix search path for invalidate_sitemap_cache function
CREATE OR REPLACE FUNCTION invalidate_sitemap_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the cached sitemap to force regeneration
  DELETE FROM sitemap_cache WHERE id = 1;
  RETURN NEW;
END;
$$;