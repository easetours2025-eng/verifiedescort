-- Add admin policy for celebrity_services table
CREATE POLICY "Admins can manage all services" 
ON public.celebrity_services 
FOR ALL 
USING (is_user_admin())
WITH CHECK (is_user_admin());