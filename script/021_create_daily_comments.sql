-- Create daily_comments table to store user-submitted daily quotes/thoughts.
CREATE TABLE IF NOT EXISTS daily_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_daily_comments_user_date ON daily_comments(user_id, date);

-- Enable RLS
ALTER TABLE daily_comments ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own daily comments
CREATE POLICY "Users can view own daily comments" ON daily_comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily comments" ON daily_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily comments" ON daily_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily comments" ON daily_comments FOR DELETE USING (auth.uid() = user_id);
