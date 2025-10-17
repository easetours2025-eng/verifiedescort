-- Step 1: Add a new column for the array-based gender
ALTER TABLE celebrity_profiles 
ADD COLUMN gender_array text[];

-- Step 2: Migrate existing data
UPDATE celebrity_profiles 
SET gender_array = CASE 
  WHEN gender IS NULL OR gender = '' THEN NULL
  ELSE ARRAY[gender]
END;

-- Step 3: Drop the old gender column
ALTER TABLE celebrity_profiles 
DROP COLUMN gender;

-- Step 4: Rename the new column to gender
ALTER TABLE celebrity_profiles 
RENAME COLUMN gender_array TO gender;

-- Add a comment to document the change
COMMENT ON COLUMN celebrity_profiles.gender IS 'Array of genders - supports multiple selections and custom values';