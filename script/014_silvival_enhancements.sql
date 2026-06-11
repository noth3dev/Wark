-- ====================================================================
-- SILVIVAL 기능 강화 및 모의고사 추천(Pool) 관련 SQL 스크립트
-- ====================================================================

-- 1. 기존 글로벌 일정 테이블에 is_silvival 컬럼 추가
ALTER TABLE public.silmo_global_schedules ADD COLUMN IF NOT EXISTS is_silvival BOOLEAN DEFAULT false;

-- 2. 모의고사 추천 풀(Pool) 테이블 생성
CREATE TABLE IF NOT EXISTS public.silmo_exam_pool (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'korean', 'math', 'both'
    created_by TEXT NOT NULL,
    question_pdf_url TEXT,
    solution_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for exam pool
ALTER TABLE public.silmo_exam_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to silmo_exam_pool" ON public.silmo_exam_pool;
CREATE POLICY "Allow public read access to silmo_exam_pool" 
ON public.silmo_exam_pool FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert silmo_exam_pool" ON public.silmo_exam_pool;
CREATE POLICY "Allow authenticated users to insert silmo_exam_pool" 
ON public.silmo_exam_pool FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Allow authenticated users to delete their own silmo_exam_pool" ON public.silmo_exam_pool;
CREATE POLICY "Allow authenticated users to delete their own silmo_exam_pool" 
ON public.silmo_exam_pool FOR DELETE TO authenticated USING (auth.uid()::text = created_by);


-- 3. 추천 풀 투표(Votes) 테이블 생성
CREATE TABLE IF NOT EXISTS public.silmo_exam_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pool_id UUID NOT NULL REFERENCES public.silmo_exam_pool(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    vote INTEGER NOT NULL, -- 1 or -1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(pool_id, user_id)
);

-- Enable RLS for votes
ALTER TABLE public.silmo_exam_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to silmo_exam_votes" ON public.silmo_exam_votes;
CREATE POLICY "Allow public read access to silmo_exam_votes" 
ON public.silmo_exam_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to manage their own votes" ON public.silmo_exam_votes;
CREATE POLICY "Allow users to manage their own votes" 
ON public.silmo_exam_votes FOR ALL TO authenticated 
USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);


-- 4. 기존 SILVIVAL 구조 개편 (is_silmodan = 1 기반으로 플레이어 동적 구성, 시즌/라운드 도입)
DROP TABLE IF EXISTS public.silvival_players CASCADE;
DROP TABLE IF EXISTS public.silvival_rounds CASCADE;

CREATE TABLE public.silvival_rounds (
    season_index INTEGER NOT NULL,
    round_index INTEGER NOT NULL,
    exam1_title TEXT NOT NULL DEFAULT '',
    exam2_title TEXT NOT NULL DEFAULT '',
    scores1 JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "user_id": score }
    scores2 JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "user_id": score }
    double_or_nothing VARCHAR(20) NOT NULL DEFAULT 'claim', -- 'claim', 'double'
    is_closed BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (season_index, round_index)
);

-- Enable RLS
ALTER TABLE public.silvival_rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to silvival_rounds" ON public.silvival_rounds;
CREATE POLICY "Allow public read access to silvival_rounds" 
ON public.silvival_rounds FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage silvival_rounds" ON public.silvival_rounds;
CREATE POLICY "Allow authenticated users to manage silvival_rounds" 
ON public.silvival_rounds FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 시즌 1(index 0) 라운드 초기화 데이터
INSERT INTO public.silvival_rounds (season_index, round_index, exam1_title, exam2_title, double_or_nothing, is_closed)
VALUES 
(0, 0, '시즌1 1R 모의고사 A', '시즌1 1R 모의고사 B', 'claim', false),
(0, 1, '시즌1 2R 모의고사 A', '시즌1 2R 모의고사 B', 'claim', false),
(0, 2, '시즌1 3R 모의고사 A', '시즌1 3R 모의고사 B', 'claim', false),
(0, 3, '시즌1 4R 모의고사 A', '시즌1 4R 모의고사 B', 'claim', false)
ON CONFLICT (season_index, round_index) DO NOTHING;

-- 5. Storage 버킷 설정 (silmo_pdfs)
-- 주의: Supabase SQL 에디터에서 실행하거나 Dashboard를 통해 만들어야 할 수도 있습니다.
INSERT INTO storage.buckets (id, name, public) VALUES ('silmo_pdfs', 'silmo_pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 설정
DROP POLICY IF EXISTS "Allow public read access to silmo_pdfs" ON storage.objects;
CREATE POLICY "Allow public read access to silmo_pdfs" 
ON storage.objects FOR SELECT USING (bucket_id = 'silmo_pdfs');

DROP POLICY IF EXISTS "Allow authenticated uploads to silmo_pdfs" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to silmo_pdfs" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'silmo_pdfs');

DROP POLICY IF EXISTS "Allow users to delete their own uploads in silmo_pdfs" ON storage.objects;
CREATE POLICY "Allow users to delete their own uploads in silmo_pdfs" 
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'silmo_pdfs' AND auth.uid()::text = owner::text);
