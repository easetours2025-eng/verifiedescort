-- Add availability fields to celebrity_profiles table
ALTER TABLE public.celebrity_profiles 
ADD COLUMN availability_start_time TIME DEFAULT '00:00:00',
ADD COLUMN availability_end_time TIME DEFAULT '23:59:59',
ADD COLUMN is_available_24h BOOLEAN DEFAULT true;

-- Update existing profiles to be available 24h by default
UPDATE public.celebrity_profiles 
SET is_available_24h = true,
    availability_start_time = '00:00:00',
    availability_end_time = '23:59:59'
WHERE is_available_24h IS NULL;