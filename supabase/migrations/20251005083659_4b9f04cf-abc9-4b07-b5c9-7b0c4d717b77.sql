-- Add new subscription tiers and duration support
ALTER TABLE celebrity_subscriptions 
DROP CONSTRAINT IF EXISTS celebrity_subscriptions_subscription_tier_check;

-- Update subscription_tier to support new tiers
ALTER TABLE celebrity_subscriptions 
ADD CONSTRAINT celebrity_subscriptions_subscription_tier_check 
CHECK (subscription_tier IN ('starter', 'basic_pro', 'prime_plus', 'vip_elite'));

-- Add duration column to track subscription length
ALTER TABLE celebrity_subscriptions 
ADD COLUMN IF NOT EXISTS duration_type text CHECK (duration_type IN ('1_week', '2_weeks', '1_month')) DEFAULT '1_month';

-- Create subscription_packages table for package definitions
CREATE TABLE IF NOT EXISTS subscription_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text NOT NULL,
  duration_type text NOT NULL CHECK (duration_type IN ('1_week', '2_weeks', '1_month')),
  price numeric NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tier_name, duration_type)
);

-- Enable RLS
ALTER TABLE subscription_packages ENABLE ROW LEVEL SECURITY;

-- Allow public to view active packages
CREATE POLICY "Public can view active subscription packages"
ON subscription_packages
FOR SELECT
USING (is_active = true);

-- Allow admins to manage packages
CREATE POLICY "Admins can manage subscription packages"
ON subscription_packages
FOR ALL
USING (is_admin_access())
WITH CHECK (is_admin_access());

-- Insert the new competitive packages
INSERT INTO subscription_packages (tier_name, duration_type, price, features, display_order) VALUES
-- 1 Month packages
('vip_elite', '1_month', 4500, 
  '["Top homepage spotlight & featured placement", "VIP Elite badge with gold styling", "Direct marketing campaigns to premium clients", "Priority customer support (24/7)", "Unlimited media uploads", "Advanced analytics dashboard", "Profile verification badge", "Social media promotion", "Featured in newsletter"]'::jsonb, 1),
('prime_plus', '1_month', 3500, 
  '["Prominent homepage listing", "Prime Plus badge", "Quality traffic optimization", "Priority support (business hours)", "Profile promotion on social media", "10 premium media uploads", "Analytics dashboard", "Featured in category"]'::jsonb, 2),
('basic_pro', '1_month', 2500, 
  '["Standard profile listing", "Basic Pro badge", "Search optimization", "Email support", "5 premium media uploads", "Basic analytics", "Profile boost once/week"]'::jsonb, 3),
('starter', '1_month', 1800, 
  '["Basic profile listing", "Starter badge", "Standard visibility", "Email support", "3 media uploads", "Easy setup & onboarding"]'::jsonb, 4),

-- 2 Weeks packages
('vip_elite', '2_weeks', 2300, 
  '["Top homepage spotlight & featured placement", "VIP Elite badge with gold styling", "Direct marketing campaigns", "Priority support", "Unlimited media uploads", "Advanced analytics", "Profile verification"]'::jsonb, 1),
('prime_plus', '2_weeks', 1800, 
  '["Prominent homepage listing", "Prime Plus badge", "Quality traffic optimization", "Priority support", "8 premium media uploads", "Analytics dashboard"]'::jsonb, 2),
('basic_pro', '2_weeks', 1300, 
  '["Standard profile listing", "Basic Pro badge", "Search optimization", "Email support", "4 premium media uploads", "Basic analytics"]'::jsonb, 3),
('starter', '2_weeks', 900, 
  '["Basic profile listing", "Starter badge", "Standard visibility", "Email support", "2 media uploads"]'::jsonb, 4),

-- 1 Week packages
('vip_elite', '1_week', 1150, 
  '["Top homepage spotlight", "VIP Elite badge", "Direct marketing", "Priority support", "Unlimited media uploads", "Advanced analytics"]'::jsonb, 1),
('prime_plus', '1_week', 900, 
  '["Prominent listing", "Prime Plus badge", "Quality traffic", "Priority support", "5 premium media uploads"]'::jsonb, 2),
('basic_pro', '1_week', 650, 
  '["Standard listing", "Basic Pro badge", "Search optimization", "3 premium media uploads"]'::jsonb, 3),
('starter', '1_week', 450, 
  '["Basic listing", "Starter badge", "Standard visibility", "1 media upload"]'::jsonb, 4);

-- Create FAQ table for admin posting information
CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Allow public to view active FAQs
CREATE POLICY "Public can view active FAQs"
ON faq_items
FOR SELECT
USING (is_active = true);

-- Allow admins to manage FAQs
CREATE POLICY "Admins can manage FAQs"
ON faq_items
FOR ALL
USING (is_admin_access())
WITH CHECK (is_admin_access());

-- Insert FAQ about admin-assisted posting
INSERT INTO faq_items (question, answer, category, display_order) VALUES
('How can I get help posting my profile?', 
'Our admin team can create and post your profile for you! Simply provide: 1) Your Name, 2) Location (town and estate), 3) Phone number, 4) Age, 5) Any services you do NOT offer, 6) Quality photos (you can hide your face with emoji, blur or crop if preferred - profiles with multiple real photos get verified faster!), 7) Videos (optional but recommended), 8) Any additional details about yourself. Contact our admin team to get started. Note: Scamming clients is strictly prohibited and will result in immediate removal.',
'getting_started', 1),

('What subscription package should I choose?',
'Choose based on your goals: STARTER (Ksh 1,800/month) - Perfect for testing the platform. BASIC PRO (Ksh 2,500/month) - Great for building your presence with weekly profile boosts. PRIME PLUS (Ksh 3,500/month) - Best value with social media promotion and priority support. VIP ELITE (Ksh 4,500/month) - Premium package with maximum visibility, 24/7 support, and direct marketing to high-end clients. All packages offer better value than competitors!',
'subscriptions', 2),

('Can I upgrade or downgrade my subscription?',
'Yes! You can upgrade to a higher tier at any time and pay the prorated difference. Downgrades take effect at the end of your current billing period. Contact support for assistance.',
'subscriptions', 3),

('What are the benefits of verified profiles?',
'Verified profiles get: VIP badge display, priority in search results, increased trust from clients, featured placement opportunities, and access to premium client inquiries. Submit multiple real photos to get verified faster!',
'verification', 4);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_packages_updated_at
BEFORE UPDATE ON subscription_packages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at
BEFORE UPDATE ON faq_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();