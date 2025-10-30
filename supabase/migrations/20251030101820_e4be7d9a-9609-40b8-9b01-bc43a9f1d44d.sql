-- Migrate existing admin user to user_roles table
INSERT INTO public.user_roles (user_id, role)
VALUES ('178c5b67-5dea-4cdf-9530-6ef87d5f8754', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add a comment to document this
COMMENT ON TABLE public.user_roles IS 'Stores user roles separately from user profiles for security. Roles: admin, celebrity, user';