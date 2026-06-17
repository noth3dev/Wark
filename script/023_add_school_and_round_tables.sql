-- 1. profiles 테이블에 school (학교) 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school TEXT DEFAULT '';

-- 2. silmo_global_schedules 테이블에 is_round_game (대항전 라운드 여부) 컬럼 추가
ALTER TABLE public.silmo_global_schedules ADD COLUMN IF NOT EXISTS is_round_game BOOLEAN DEFAULT false;

-- 3. 학교별 5개 라운드 점수 분배 테이블 생성
CREATE TABLE IF NOT EXISTS public.silmo_round_distributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID NOT NULL REFERENCES public.silmo_global_schedules(id) ON DELETE CASCADE,
    school TEXT NOT NULL,
    r1 INTEGER DEFAULT 0,
    r2 INTEGER DEFAULT 0,
    r3 INTEGER DEFAULT 0,
    r4 INTEGER DEFAULT 0,
    r5 INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(schedule_id, school)
);

-- Enable RLS
ALTER TABLE public.silmo_round_distributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read access to silmo_round_distributions" ON public.silmo_round_distributions;
CREATE POLICY "Allow public read access to silmo_round_distributions" 
ON public.silmo_round_distributions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage silmo_round_distributions" ON public.silmo_round_distributions;
CREATE POLICY "Allow authenticated users to manage silmo_round_distributions" 
ON public.silmo_round_distributions FOR ALL TO authenticated USING (true) WITH CHECK (true);
