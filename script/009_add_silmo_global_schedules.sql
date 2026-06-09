-- Create silmo_global_schedules table
CREATE TABLE IF NOT EXISTS public.silmo_global_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'korean', 'math', 'both'
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS silmo_global_schedules_date_idx ON public.silmo_global_schedules(date);

-- Enable RLS on silmo_global_schedules
ALTER TABLE public.silmo_global_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for silmo_global_schedules
-- Allow public select so anyone can see today's global schedules
DROP POLICY IF EXISTS "Allow public read access to silmo_global_schedules" ON public.silmo_global_schedules;
CREATE POLICY "Allow public read access to silmo_global_schedules" 
ON public.silmo_global_schedules FOR SELECT 
USING (true);

-- Allow authenticated users to insert global schedules
DROP POLICY IF EXISTS "Allow authenticated users to insert silmo_global_schedules" ON public.silmo_global_schedules;
CREATE POLICY "Allow authenticated users to insert silmo_global_schedules" 
ON public.silmo_global_schedules FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = created_by);
