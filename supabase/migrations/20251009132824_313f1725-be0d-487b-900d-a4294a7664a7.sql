-- Drop the existing gender check constraint
ALTER TABLE celebrity_profiles 
DROP CONSTRAINT IF EXISTS celebrity_profiles_gender_check;

-- Add a new check constraint that includes 'bisexual' as a valid option
ALTER TABLE celebrity_profiles 
ADD CONSTRAINT celebrity_profiles_gender_check 
CHECK (gender IN ('male', 'female', 'bisexual') OR gender IS NULL);