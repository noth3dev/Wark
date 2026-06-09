-- Create silmo_records table
CREATE TABLE IF NOT EXISTS public.silmo_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'korean', 'math', 'both'
    title TEXT NOT NULL DEFAULT '실전 모의고사', -- 실모 이름
    korean_score INTEGER,
    math_score INTEGER,
    total_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure title column exists in case the table was created before title was added
ALTER TABLE public.silmo_records ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '실전 모의고사';

-- Indexing for performance
CREATE INDEX IF NOT EXISTS silmo_records_user_id_idx ON public.silmo_records(user_id);

-- Enable RLS on silmo_records
ALTER TABLE public.silmo_records ENABLE ROW LEVEL SECURITY;

-- Policies for silmo_records
-- Allow public select so users can see each other's scores for the leaderboard
DROP POLICY IF EXISTS "Allow public read access to silmo_records" ON public.silmo_records;
CREATE POLICY "Allow public read access to silmo_records" 
ON public.silmo_records FOR SELECT 
USING (true);

-- Allow users to insert their own records
DROP POLICY IF EXISTS "Allow authenticated users to insert their own silmo_records" ON public.silmo_records;
CREATE POLICY "Allow authenticated users to insert their own silmo_records" 
ON public.silmo_records FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);


-- Create silmo_sessions table for real-time status tracking
CREATE TABLE IF NOT EXISTS public.silmo_sessions (
    user_id TEXT PRIMARY KEY,
    status VARCHAR(20) NOT NULL, -- 'active', 'break', 'finished'
    current_phase VARCHAR(20) NOT NULL, -- 'korean', 'break', 'math', 'finished'
    exam_type VARCHAR(20) NOT NULL, -- 'korean', 'math', 'both'
    remaining_seconds INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on silmo_sessions
ALTER TABLE public.silmo_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for silmo_sessions
-- Allow public select so users can see active exams of friends
DROP POLICY IF EXISTS "Allow public read access to silmo_sessions" ON public.silmo_sessions;
CREATE POLICY "Allow public read access to silmo_sessions" 
ON public.silmo_sessions FOR SELECT 
USING (true);

-- Allow users to manage their own sessions (insert/update/delete)
DROP POLICY IF EXISTS "Allow users to manage their own silmo_sessions" ON public.silmo_sessions;
CREATE POLICY "Allow users to manage their own silmo_sessions" 
ON public.silmo_sessions FOR ALL 
TO authenticated 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);
