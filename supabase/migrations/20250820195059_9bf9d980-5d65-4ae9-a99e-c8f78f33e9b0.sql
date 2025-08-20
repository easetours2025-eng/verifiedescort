-- Create conversations table for unique messaging between users
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  celebrity_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(celebrity_id, user_id)
);

-- Create messages table for conversation messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('celebrity', 'user')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Create payment_verification table for M-Pesa payments
CREATE TABLE public.payment_verification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  celebrity_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  mpesa_code TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 10,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create celebrity_subscriptions table to track active subscriptions
CREATE TABLE public.celebrity_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  celebrity_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  last_payment_id UUID REFERENCES public.payment_verification(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebrity_subscriptions ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  celebrity_id IN (
    SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations with celebrities" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE user_id = auth.uid() OR 
    celebrity_id IN (
      SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can send messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE user_id = auth.uid() OR 
    celebrity_id IN (
      SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
    )
  )
);

-- Payment verification policies
CREATE POLICY "Celebrities can view their own payment records" 
ON public.payment_verification 
FOR SELECT 
USING (
  celebrity_id IN (
    SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Celebrities can submit payment verification" 
ON public.payment_verification 
FOR INSERT 
WITH CHECK (
  celebrity_id IN (
    SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
  )
);

-- Celebrity subscriptions policies
CREATE POLICY "Anyone can view active subscriptions for visibility check" 
ON public.celebrity_subscriptions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Celebrities can view their own subscription status" 
ON public.celebrity_subscriptions 
FOR SELECT 
USING (
  celebrity_id IN (
    SELECT id FROM celebrity_profiles WHERE user_id = auth.uid()
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_celebrity_subscriptions_updated_at
BEFORE UPDATE ON public.celebrity_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if celebrity subscription is active
CREATE OR REPLACE FUNCTION public.is_celebrity_subscription_active(celebrity_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM celebrity_subscriptions 
    WHERE celebrity_id = celebrity_profile_id 
    AND is_active = true 
    AND subscription_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;