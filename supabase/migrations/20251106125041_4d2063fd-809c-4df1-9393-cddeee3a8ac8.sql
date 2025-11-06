-- Create table for review action tokens
CREATE TABLE IF NOT EXISTS public.review_action_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.celebrity_reviews(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'reject')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_action_tokens ENABLE ROW LEVEL SECURITY;

-- Create index for faster token lookups
CREATE INDEX idx_review_action_tokens_token ON public.review_action_tokens(token);
CREATE INDEX idx_review_action_tokens_review_id ON public.review_action_tokens(review_id);

-- RLS Policy: Only allow reading by anyone (for token verification in edge function)
CREATE POLICY "Anyone can read tokens for verification"
  ON public.review_action_tokens
  FOR SELECT
  USING (true);

-- RLS Policy: Only allow insert/update by service role (via edge functions)
CREATE POLICY "Service role can manage tokens"
  ON public.review_action_tokens
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to generate and send review notification
CREATE OR REPLACE FUNCTION public.notify_admins_of_new_review()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url text;
BEGIN
  supabase_url := 'https://kpjqcrhoablsllkgonbl.supabase.co';
  
  -- Call the edge function to send email notifications
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/notify-review-submission',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
    ),
    body := jsonb_build_object(
      'review_id', NEW.id,
      'celebrity_id', NEW.celebrity_id,
      'rating', NEW.rating,
      'review_text', NEW.review_text
    )
  );
  
  RETURN NEW;
  
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to notify admins of new review: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new review notifications
DROP TRIGGER IF EXISTS trigger_notify_admins_on_new_review ON public.celebrity_reviews;
CREATE TRIGGER trigger_notify_admins_on_new_review
  AFTER INSERT ON public.celebrity_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_of_new_review();