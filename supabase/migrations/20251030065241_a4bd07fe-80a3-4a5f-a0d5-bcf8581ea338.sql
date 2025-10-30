-- Create user roles system to replace localStorage-based admin authentication
-- This prevents client-side authentication bypass attacks

-- Step 1: Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'celebrity', 'user');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Step 3: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 5: Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Step 6: Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_user_admin());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- Step 7: Migrate existing admin_users to Supabase Auth and user_roles
-- This will be done manually by admin to preserve admin accounts

-- Step 8: Update RLS policies to use new role system instead of admin_users table
-- Update admin_users table policies to use new system
DROP POLICY IF EXISTS "Admins can read admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Block all public access to admin data" ON public.admin_users;
DROP POLICY IF EXISTS "Block all public admin deletions" ON public.admin_users;
DROP POLICY IF EXISTS "Block all public admin modifications" ON public.admin_users;

CREATE POLICY "Only admins can access admin_users"
ON public.admin_users
FOR ALL
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- Update celebrity_profiles policies
DROP POLICY IF EXISTS "Admins can manage all celebrity profiles" ON public.celebrity_profiles;
DROP POLICY IF EXISTS "Admins can update celebrity profiles" ON public.celebrity_profiles;
DROP POLICY IF EXISTS "Verified admins can manage all celebrity profiles" ON public.celebrity_profiles;

CREATE POLICY "Admins can manage all celebrity profiles"
ON public.celebrity_profiles
FOR ALL
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- Update payment_verification policies
DROP POLICY IF EXISTS "Admins can create payment verifications" ON public.payment_verification;
DROP POLICY IF EXISTS "Admins can update payment verification" ON public.payment_verification;
DROP POLICY IF EXISTS "Admins can view payment verifications" ON public.payment_verification;

CREATE POLICY "Admins can manage payment verifications"
ON public.payment_verification
FOR ALL
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- Update celebrity_subscriptions policies
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.celebrity_subscriptions;

CREATE POLICY "Admins can manage all subscriptions"
ON public.celebrity_subscriptions
FOR ALL
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- Update other admin-related policies
DROP POLICY IF EXISTS "Admins can view all profile views" ON public.profile_views;
CREATE POLICY "Admins can view all profile views"
ON public.profile_views
FOR SELECT
USING (public.is_user_admin());

DROP POLICY IF EXISTS "Admins can view all whatsapp clicks" ON public.whatsapp_clicks;
CREATE POLICY "Admins can view all whatsapp clicks"
ON public.whatsapp_clicks
FOR SELECT
USING (public.is_user_admin());

DROP POLICY IF EXISTS "Admins can view all call clicks" ON public.call_clicks;
CREATE POLICY "Admins can view all call clicks"
ON public.call_clicks
FOR SELECT
USING (public.is_user_admin());

-- Update is_current_user_admin function to use new role system
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Update is_admin_access function
CREATE OR REPLACE FUNCTION public.is_admin_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Fix SECURITY DEFINER functions missing search_path
CREATE OR REPLACE FUNCTION public.is_special_offer_active(profile_created_at timestamp with time zone, special_offer_registered_at timestamp with time zone)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    special_offer_registered_at IS NOT NULL 
    AND special_offer_registered_at >= '2025-01-27 00:00:00+00'::TIMESTAMP WITH TIME ZONE
    AND special_offer_registered_at <= '2025-02-01 23:59:59+00'::TIMESTAMP WITH TIME ZONE
    AND NOW() <= (special_offer_registered_at + INTERVAL '5 days');
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  is_offer_period BOOLEAN;
BEGIN
  -- Check if we're in the special offer period
  is_offer_period := (
    NOW() >= '2025-01-27 00:00:00+00'::TIMESTAMP WITH TIME ZONE 
    AND NOW() <= '2025-02-01 23:59:59+00'::TIMESTAMP WITH TIME ZONE
  );
  
  INSERT INTO public.celebrity_profiles (
    user_id, 
    stage_name, 
    email,
    phone_number,
    special_offer_registered_at,
    is_special_offer_active,
    is_available
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'stage_name', 'New Celebrity'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone, ''),
    CASE WHEN is_offer_period THEN NOW() ELSE NULL END,
    is_offer_period,
    is_offer_period
  );
  
  -- Add 'celebrity' role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'celebrity')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;