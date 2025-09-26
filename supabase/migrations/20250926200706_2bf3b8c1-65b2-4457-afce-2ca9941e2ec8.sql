-- Update celebrity_services table to remove price dependency
-- Remove price column since services will not show pricing
ALTER TABLE public.celebrity_services DROP COLUMN IF EXISTS price;

-- Update service to be more focused on just service names and descriptions
-- Keep duration for internal tracking but won't display it publicly