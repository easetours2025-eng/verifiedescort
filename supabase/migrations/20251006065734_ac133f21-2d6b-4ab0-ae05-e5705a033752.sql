-- Fix admin_videos table to remove foreign key constraint
-- Since admins don't use auth.users, we shouldn't reference it

-- Drop the foreign key constraint
ALTER TABLE admin_videos 
DROP CONSTRAINT IF EXISTS admin_videos_created_by_fkey;

-- Make created_by nullable since it's not critical
ALTER TABLE admin_videos 
ALTER COLUMN created_by DROP NOT NULL;

-- Add a comment to clarify this is admin_users.id, not auth.users.id
COMMENT ON COLUMN admin_videos.created_by IS 'References admin_users.id (not auth.users.id)';