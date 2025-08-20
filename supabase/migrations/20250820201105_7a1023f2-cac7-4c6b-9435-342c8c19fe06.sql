-- Enable realtime for payment verification and celebrity profiles
ALTER TABLE public.payment_verification REPLICA IDENTITY FULL;
ALTER TABLE public.celebrity_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.celebrity_subscriptions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_verification;
ALTER PUBLICATION supabase_realtime ADD TABLE public.celebrity_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.celebrity_subscriptions;