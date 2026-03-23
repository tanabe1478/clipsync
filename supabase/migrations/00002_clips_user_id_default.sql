-- Set user_id default to the authenticated user's ID
-- This allows INSERT without explicitly passing user_id
ALTER TABLE clips ALTER COLUMN user_id SET DEFAULT auth.uid();
