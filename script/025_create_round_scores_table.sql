-- Create public.silmo_round_scores table to temporarily store scores before the round game is closed
CREATE TABLE IF NOT EXISTS public.silmo_round_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID NOT NULL REFERENCES public.silmo_global_schedules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL, -- 'korean', 'math', 'explore', etc.
    score INTEGER NOT NULL,
    wrong_numbers TEXT,
    is_post_take BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(schedule_id, user_id, subject)
);

-- Enable RLS
ALTER TABLE public.silmo_round_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read access to silmo_round_scores" ON public.silmo_round_scores;
CREATE POLICY "Allow public read access to silmo_round_scores" 
ON public.silmo_round_scores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage silmo_round_scores" ON public.silmo_round_scores;
CREATE POLICY "Allow authenticated users to manage silmo_round_scores" 
ON public.silmo_round_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);
