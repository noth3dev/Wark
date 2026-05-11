CREATE TABLE repeat_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{"rows": [], "columns": [], "data": {}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE repeat_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own repeat tables" ON repeat_tables
  FOR ALL USING (auth.uid() = user_id);
