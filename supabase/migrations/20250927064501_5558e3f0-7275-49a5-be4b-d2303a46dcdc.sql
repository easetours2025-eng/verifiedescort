-- Fix admin_users table security vulnerability
-- Drop ALL existing policies first, then create proper restrictions

-- Drop all existing policies on admin_users table
DROP POLICY IF EXISTS "Admin users can view themselves" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin user creation when no admins exist or by existing a" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update themselves" ON public.admin_users;
DROP POLICY IF EXISTS "Allow first admin creation only" ON public.admin_users;
DROP POLICY IF EXISTS "No public access to admin credentials" ON public.admin_users;
DROP POLICY IF EXISTS "No public admin updates" ON public.admin_users;
DROP POLICY IF EXISTS "No public admin deletes" ON public.admin_users;

-- Create restrictive RLS policies for admin_users table
-- These policies will prevent public access while allowing admin edge functions to work via service role

-- Allow admin creation only when no admins exist (for initial setup)
CREATE POLICY "Restrict admin creation to first admin only"
ON public.admin_users
FOR INSERT
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.admin_users LIMIT 1)
);

-- Completely restrict SELECT access to prevent credential exposure
-- Admin authentication will be handled via edge functions with service role only
CREATE POLICY "Block all public access to admin data"
ON public.admin_users
FOR SELECT
USING (false);

-- Prevent all public updates and deletes
CREATE POLICY "Block all public admin modifications"
ON public.admin_users
FOR UPDATE
USING (false);

CREATE POLICY "Block all public admin deletions"
ON public.admin_users
FOR DELETE
USING (false);