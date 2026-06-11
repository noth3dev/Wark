-- ====================================================================
-- SILVIVAL (실모 서바이벌 리그) 관련 테이블 생성 SQL 스크립트
-- ====================================================================

-- 1. 실바이벌 리그 참가자 테이블 (3명 제한)
CREATE TABLE IF NOT EXISTS public.silvival_players (
    slot_index INTEGER PRIMARY KEY, -- 0, 1, 2
    user_id TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.silvival_players ENABLE ROW LEVEL SECURITY;

-- Policies for silvival_players
DROP POLICY IF EXISTS "Allow public read access to silvival_players" ON public.silvival_players;
CREATE POLICY "Allow public read access to silvival_players" 
ON public.silvival_players FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage silvival_players" ON public.silvival_players;
CREATE POLICY "Allow authenticated users to manage silvival_players" 
ON public.silvival_players FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 2. 실바이벌 리그 라운드 데이터 테이블 (4개 라운드)
CREATE TABLE IF NOT EXISTS public.silvival_rounds (
    round_index INTEGER PRIMARY KEY, -- 0, 1, 2, 3
    exam1_title TEXT NOT NULL DEFAULT '',
    exam2_title TEXT NOT NULL DEFAULT '',
    scores1 JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "user_id": score }
    scores2 JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "user_id": score }
    double_or_nothing VARCHAR(20) NOT NULL DEFAULT 'claim', -- 'claim', 'double'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.silvival_rounds ENABLE ROW LEVEL SECURITY;

-- Policies for silvival_rounds
DROP POLICY IF EXISTS "Allow public read access to silvival_rounds" ON public.silvival_rounds;
CREATE POLICY "Allow public read access to silvival_rounds" 
ON public.silvival_rounds FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage silvival_rounds" ON public.silvival_rounds;
CREATE POLICY "Allow authenticated users to manage silvival_rounds" 
ON public.silvival_rounds FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 3. 초기 더미 데이터 삽입 (선택 사항 - 테이블 생성 시 기본 뼈대 확보)
INSERT INTO public.silvival_rounds (round_index, exam1_title, exam2_title, scores1, scores2, double_or_nothing)
VALUES 
(0, '1회차 모의고사 A', '1회차 모의고사 B', '{}'::jsonb, '{}'::jsonb, 'claim'),
(1, '2회차 모의고사 A', '2회차 모의고사 B', '{}'::jsonb, '{}'::jsonb, 'claim'),
(2, '3회차 모의고사 A', '3회차 모의고사 B', '{}'::jsonb, '{}'::jsonb, 'claim'),
(3, '4회차 모의고사 A', '4회차 모의고사 B', '{}'::jsonb, '{}'::jsonb, 'claim')
ON CONFLICT (round_index) DO NOTHING;
