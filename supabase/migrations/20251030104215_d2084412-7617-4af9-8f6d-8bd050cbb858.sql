-- Create table for PayPal payment tracking
CREATE TABLE IF NOT EXISTS public.paypal_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id UUID NOT NULL REFERENCES public.celebrity_profiles(id) ON DELETE CASCADE,
  paypal_email TEXT NOT NULL,
  paypal_transaction_id TEXT,
  amount_usd NUMERIC NOT NULL,
  subscription_tier TEXT,
  duration_type TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  payment_status TEXT DEFAULT 'pending',
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.paypal_payments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all PayPal payments
CREATE POLICY "Admins can manage all PayPal payments"
  ON public.paypal_payments
  FOR ALL
  USING (is_user_admin())
  WITH CHECK (is_user_admin());

-- Celebrities can view their own PayPal payments
CREATE POLICY "Celebrities can view their PayPal payments"
  ON public.paypal_payments
  FOR SELECT
  USING (
    celebrity_id IN (
      SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
    )
  );

-- Celebrities can create their own PayPal payment records
CREATE POLICY "Celebrities can create PayPal payment records"
  ON public.paypal_payments
  FOR INSERT
  WITH CHECK (
    celebrity_id IN (
      SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_paypal_payments_celebrity_id ON public.paypal_payments(celebrity_id);
CREATE INDEX idx_paypal_payments_verified ON public.paypal_payments(is_verified);
CREATE INDEX idx_paypal_payments_created_at ON public.paypal_payments(created_at DESC);

COMMENT ON TABLE public.paypal_payments IS 'Tracks PayPal payments for non-East Africa users';