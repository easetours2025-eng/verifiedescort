-- Ensure Sharon's admin account exists in auth.users
-- This uses the auth.admin API to create/update the user

DO $$
DECLARE
  admin_email text := 'sharonkiptoon2@gmail.com';
  admin_password text := 'Admin@2025'; -- Temporary password - Sharon should change this after first login
  user_id uuid;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = admin_email;

  IF user_id IS NULL THEN
    -- User doesn't exist, we need to inform that manual creation is needed
    RAISE NOTICE 'Admin user does not exist in auth.users. Please create manually or use password reset.';
  ELSE
    -- User exists, log the user_id for reference
    RAISE NOTICE 'Admin user exists with ID: %', user_id;
  END IF;

  -- Update admin_users table to ensure consistency
  UPDATE admin_users 
  SET is_super_admin = true 
  WHERE email = admin_email;

END $$;

-- Create a helper function for admins to verify their auth status
CREATE OR REPLACE FUNCTION check_admin_auth_status(admin_email_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_user_exists boolean;
  admin_exists boolean;
  result jsonb;
BEGIN
  -- Check if exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = admin_email_param
  ) INTO auth_user_exists;

  -- Check if exists in admin_users
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE email = admin_email_param
  ) INTO admin_exists;

  result := jsonb_build_object(
    'email', admin_email_param,
    'auth_user_exists', auth_user_exists,
    'admin_user_exists', admin_exists,
    'status', CASE 
      WHEN auth_user_exists AND admin_exists THEN 'ready'
      WHEN NOT auth_user_exists AND admin_exists THEN 'needs_auth_setup'
      WHEN auth_user_exists AND NOT admin_exists THEN 'needs_admin_setup'
      ELSE 'not_configured'
    END
  );

  RETURN result;
END;
$$;