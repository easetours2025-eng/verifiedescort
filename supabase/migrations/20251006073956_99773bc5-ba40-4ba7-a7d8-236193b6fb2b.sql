-- Insert 1 Week subscription packages
INSERT INTO subscription_packages (tier_name, duration_type, price, features, display_order, is_active) VALUES
(
  'vip_elite',
  '1_week',
  1150,
  '["Top homepage spotlight & featured placement", "VIP Elite badge with gold styling", "Direct marketing campaigns to premium clients", "Priority customer support (24/7)", "Unlimited media uploads", "Advanced analytics dashboard", "Profile verification badge"]'::jsonb,
  1,
  true
),
(
  'prime_plus',
  '1_week',
  900,
  '["Prominent homepage listing", "Prime Plus badge", "Quality traffic optimization", "Priority support (business hours)", "5 premium media uploads", "Analytics dashboard", "Featured in category"]'::jsonb,
  2,
  true
),
(
  'basic_pro',
  '1_week',
  650,
  '["Standard profile listing", "Basic Pro badge", "Search optimization", "Email support", "3 premium media uploads", "Basic analytics"]'::jsonb,
  3,
  true
),
(
  'starter',
  '1_week',
  450,
  '["Basic profile listing", "Starter badge", "Standard visibility", "Email support", "1 media upload", "Easy setup & onboarding"]'::jsonb,
  4,
  true
)
ON CONFLICT DO NOTHING;