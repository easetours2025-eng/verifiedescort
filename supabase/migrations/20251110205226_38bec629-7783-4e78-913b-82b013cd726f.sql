-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Update ping_search_engines function to use the correct extension schema
CREATE OR REPLACE FUNCTION public.ping_search_engines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
  request_id bigint;
BEGIN
  supabase_url := 'https://kpjqcrhoablsllkgonbl.supabase.co';
  
  -- Call the edge function to ping search engines using pg_net
  SELECT extensions.http_post(
    url := supabase_url || '/functions/v1/ping-search-engines',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) INTO request_id;
  
  -- Log successful ping initiation
  RAISE NOTICE 'Search engine ping initiated with request_id: %', request_id;
  
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to ping search engines: %', SQLERRM;
END;
$$;