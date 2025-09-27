-- Fix admin_users table security vulnerability
-- Drop existing permissive policies and create proper restrictions

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Admin users can view themselves" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin user creation when no admins exist or by existing a" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update themselves" ON public.admin_users;

-- Create a security definer function to validate admin access
-- This function will be used by RLS policies to check if current request is from an admin
CREATE OR REPLACE FUNCTION public.is_admin_request()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- For admin operations, we need to restrict access more carefully
  -- Since admin auth is handled via edge functions, we'll only allow
  -- access when explicitly called from admin edge functions
  -- This prevents public access to admin_users table
  RETURN false;
END;
$$;

-- Create restrictive RLS policies for admin_users table
-- These policies will prevent public access while allowing admin edge functions to work

-- Allow admin creation only when no admins exist (for initial setup)
CREATE POLICY "Allow first admin creation only"
ON public.admin_users
FOR INSERT
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.admin_users LIMIT 1)
);

-- Completely restrict SELECT access to prevent credential exposure
-- Admin authentication will be handled via edge functions only
CREATE POLICY "No public access to admin credentials"
ON public.admin_users
FOR SELECT
USING (false);

-- Prevent public updates and deletes
CREATE POLICY "No public admin updates"
ON public.admin_users
FOR UPDATE
USING (false);

CREATE POLICY "No public admin deletes"
ON public.admin_users
FOR DELETE
USING (false);