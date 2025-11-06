-- Create function to invalidate sitemap cache when celebrity profiles change
CREATE OR REPLACE FUNCTION invalidate_sitemap_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the cached sitemap to force regeneration
  DELETE FROM sitemap_cache WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to invalidate cache when celebrity profiles are inserted or updated
DROP TRIGGER IF EXISTS trigger_invalidate_sitemap_on_celebrity_change ON celebrity_profiles;
CREATE TRIGGER trigger_invalidate_sitemap_on_celebrity_change
  AFTER INSERT OR UPDATE OF is_available, is_verified, profile_picture_path, phone_number, stage_name, updated_at
  ON celebrity_profiles
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_sitemap_cache();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION invalidate_sitemap_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION invalidate_sitemap_cache() TO anon;