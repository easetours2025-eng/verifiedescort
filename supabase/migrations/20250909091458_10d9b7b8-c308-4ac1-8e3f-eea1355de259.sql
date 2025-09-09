-- Add INSERT policy for admin_users table to allow creating admin accounts
CREATE POLICY "Allow admin user creation when no admins exist or by existing admins" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (
  -- Allow if no admin users exist (for first admin creation)
  NOT EXISTS (SELECT 1 FROM public.admin_users LIMIT 1)
  OR
  -- Allow if current user is already an admin (for creating additional admins)
  is_current_user_admin()
);

-- Add UPDATE policy for admin_users table
CREATE POLICY "Admin users can update themselves" 
ON public.admin_users 
FOR UPDATE 
USING (((auth.uid())::text = (id)::text) OR (is_super_admin = true))
WITH CHECK (((auth.uid())::text = (id)::text) OR (is_super_admin = true));