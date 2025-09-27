-- Fix payment_verification table security vulnerability
-- Remove overly permissive development policy and implement proper access controls

-- Drop the existing dangerous policy that allows public access to sensitive payment data
DROP POLICY IF EXISTS "Development admin payment access" ON public.payment_verification;

-- Create secure RLS policies for payment_verification table
-- These policies will protect sensitive financial data from unauthorized access

-- Only allow admins to view payment verification data
CREATE POLICY "Admins can view payment verifications"
ON public.payment_verification
FOR SELECT
USING (is_admin_access());

-- Only allow admins to create payment verification records
CREATE POLICY "Admins can create payment verifications"
ON public.payment_verification
FOR INSERT
WITH CHECK (is_admin_access());

-- Only allow admins to update payment verification records
CREATE POLICY "Admins can update payment verifications"
ON public.payment_verification
FOR UPDATE
USING (is_admin_access())
WITH CHECK (is_admin_access());

-- Only allow admins to delete payment verification records
CREATE POLICY "Admins can delete payment verifications"
ON public.payment_verification
FOR DELETE
USING (is_admin_access());

-- Note: This completely restricts public access to sensitive payment data
-- including phone numbers, M-Pesa codes, payment amounts, and verification status
-- Only authenticated admin users can access this data through the admin dashboard