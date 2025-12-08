-- Create marketers table for referral system
CREATE TABLE public.marketers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create referred_users table to track referrals
CREATE TABLE public.referred_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  marketer_id UUID NOT NULL REFERENCES public.marketers(id) ON DELETE CASCADE,
  celebrity_profile_id UUID REFERENCES public.celebrity_profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.marketers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referred_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for marketers table
CREATE POLICY "Admins can manage marketers"
  ON public.marketers
  FOR ALL
  USING (is_user_admin())
  WITH CHECK (is_user_admin());

CREATE POLICY "Public can view active marketers for referral validation"
  ON public.marketers
  FOR SELECT
  USING (is_active = true);

-- RLS policies for referred_users table
CREATE POLICY "Admins can manage referred users"
  ON public.referred_users
  FOR ALL
  USING (is_user_admin())
  WITH CHECK (is_user_admin());

CREATE POLICY "System can insert referred users"
  ON public.referred_users
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_marketers_referral_code ON public.marketers(referral_code);
CREATE INDEX idx_referred_users_marketer_id ON public.referred_users(marketer_id);
CREATE INDEX idx_referred_users_user_email ON public.referred_users(user_email);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(marketer_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base code from first part of name (uppercase) + random 4 digits
  base_code := UPPER(REGEXP_REPLACE(SPLIT_PART(marketer_name, ' ', 1), '[^A-Za-z]', '', 'g'));
  base_code := SUBSTRING(base_code FROM 1 FOR 6);
  
  LOOP
    IF counter = 0 THEN
      final_code := base_code || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    ELSE
      final_code := base_code || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;
    
    -- Check if code exists
    IF NOT EXISTS (SELECT 1 FROM public.marketers WHERE referral_code = final_code) THEN
      RETURN final_code;
    END IF;
    
    counter := counter + 1;
    
    -- Safety exit after 100 attempts
    IF counter > 100 THEN
      RETURN base_code || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    END IF;
  END LOOP;
END;
$$;

-- Function to get referral statistics
CREATE OR REPLACE FUNCTION public.get_marketer_referral_stats()
RETURNS TABLE (
  marketer_id UUID,
  marketer_name TEXT,
  marketer_email TEXT,
  referral_code TEXT,
  is_active BOOLEAN,
  total_referrals BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id as marketer_id,
    m.name as marketer_name,
    m.email as marketer_email,
    m.referral_code,
    m.is_active,
    COUNT(ru.id) as total_referrals,
    m.created_at
  FROM marketers m
  LEFT JOIN referred_users ru ON m.id = ru.marketer_id
  GROUP BY m.id, m.name, m.email, m.referral_code, m.is_active, m.created_at
  ORDER BY total_referrals DESC, m.created_at DESC;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_marketers_updated_at
  BEFORE UPDATE ON public.marketers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();