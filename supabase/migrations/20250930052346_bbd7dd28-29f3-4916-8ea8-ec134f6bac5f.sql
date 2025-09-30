-- Update launch date to September 30, 2025
UPDATE public.system_config 
SET config_value = '2025-09-30T00:00:00Z'
WHERE config_key = 'launch_date';