-- Insert 2 Weeks subscription packages
INSERT INTO subscription_packages (tier_name, duration_type, price, features, display_order, is_active) VALUES
(
  'vip_elite',
  '2_weeks',
  2300,
  '["Top homepage spotlight & featured placement", "VIP Elite badge with gold styling", "Direct marketing campaigns to premium clients", "Priority customer support (24/7)", "Unlimited media uploads", "Advanced analytics dashboard", "Profile verification badge", "Social media promotion"]'::jsonb,
  1,
  true
),
(
  'prime_plus',
  '2_weeks',
  1800,
  '["Prominent homepage listing", "Prime Plus badge", "Quality traffic optimization", "Priority support (business hours)", "Profile promotion on social media", "8 premium media uploads", "Analytics dashboard", "Featured in category"]'::jsonb,
  2,
  true
),
(
  'basic_pro',
  '2_weeks',
  1300,
  '["Standard profile listing", "Basic Pro badge", "Search optimization", "Email support", "4 premium media uploads", "Basic analytics", "Profile boost once/week"]'::jsonb,
  3,
  true
),
(
  'starter',
  '2_weeks',
  900,
  '["Basic profile listing", "Starter badge", "Standard visibility", "Email support", "2 media uploads", "Easy setup & onboarding"]'::jsonb,
  4,
  true
)
ON CONFLICT DO NOTHING;