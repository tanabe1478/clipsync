-- Create clips table for cloud clipboard sync
CREATE TABLE clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    device_name TEXT NOT NULL DEFAULT 'Unknown',
    pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching recent clips per user (most common query)
CREATE INDEX idx_clips_user_id_created_at ON clips (user_id, created_at DESC);

-- Partial index for pinned clips per user
CREATE INDEX idx_clips_user_id_pinned ON clips (user_id, pinned) WHERE pinned = true;

-- Enable Row Level Security
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own clips
CREATE POLICY "Users can read own clips"
    ON clips FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clips"
    ON clips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clips"
    ON clips FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clips"
    ON clips FOR DELETE
    USING (auth.uid() = user_id);

-- Required for Supabase Realtime to broadcast full row data on UPDATE/DELETE
ALTER TABLE clips REPLICA IDENTITY FULL;

-- Enable Realtime for clips table
ALTER PUBLICATION supabase_realtime ADD TABLE clips;
