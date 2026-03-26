-- Memos table: supports multiple notes per user
CREATE TABLE IF NOT EXISTS memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookup by user
CREATE INDEX idx_memos_user_id ON memos(user_id);
CREATE INDEX idx_memos_updated_at ON memos(user_id, updated_at DESC);

-- Enable RLS
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own memos
CREATE POLICY "Users can view own memos" ON memos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memos" ON memos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memos" ON memos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memos" ON memos FOR DELETE USING (auth.uid() = user_id);
