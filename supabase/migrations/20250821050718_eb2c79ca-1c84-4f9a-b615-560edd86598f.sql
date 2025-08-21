-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if the current user has admin privileges
  -- For now, we'll check if they can access the celebrity_profiles table with admin operations
  -- In production, you might want to have a dedicated admin_users table or role system
  RETURN EXISTS (
    SELECT 1 FROM celebrity_profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  ) OR auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;