-- Migration: Add active_sessions table for DB-based time tracking
-- This allows accurate time tracking even when client disconnects

-- 1. Create active_sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, tag_id)
);

-- 2. Enable RLS
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policy
CREATE POLICY "Users can manage their own active sessions" ON active_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 4. Create index for faster lookups
CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_tag_id ON active_sessions(tag_id);

-- 5. Helper function to get current active session elapsed time
CREATE OR REPLACE FUNCTION get_active_session_elapsed(p_user_id UUID, p_tag_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_elapsed BIGINT;
BEGIN
  SELECT start_time INTO v_start_time
  FROM active_sessions
  WHERE user_id = p_user_id AND tag_id = p_tag_id;
  
  IF v_start_time IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Return elapsed time in milliseconds
  v_elapsed := EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000;
  RETURN v_elapsed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
