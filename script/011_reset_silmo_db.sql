-- ====================================================================
-- 실모(Silmo) 관련 테이블 데이터 및 구조 초기화 SQL 스크립트
-- ====================================================================

-- [방법 1] 테이블 스키마는 그대로 유지하고 데이터만 전부 삭제 (안전하고 권장됨)
TRUNCATE TABLE public.silmo_records CASCADE;
TRUNCATE TABLE public.silmo_sessions CASCADE;
TRUNCATE TABLE public.silmo_global_schedules CASCADE;


-- [방법 2] 기존 테이블을 완전히 삭제(Drop)하고 초기 상태로 재생성 (스키마 리셋이 필요할 때 사용)
/*
-- 기존 테이블 삭제
DROP TABLE IF EXISTS public.silmo_records CASCADE;
DROP TABLE IF EXISTS public.silmo_sessions CASCADE;
DROP TABLE IF EXISTS public.silmo_global_schedules CASCADE;

-- 1. silmo_records (실모 개인 점수 기록 테이블) 생성
CREATE TABLE public.silmo_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'korean', 'math', 'both'
    title TEXT NOT NULL DEFAULT '실전 모의고사',
    korean_score INTEGER,
    math_score INTEGER,
    total_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS silmo_records_user_id_idx ON public.silmo_records(user_id);
ALTER TABLE public.silmo_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to silmo_records" 
ON public.silmo_records FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert their own silmo_records" 
ON public.silmo_records FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

-- 2. silmo_sessions (실시간 타이머 공유 세션 테이블) 생성
CREATE TABLE public.silmo_sessions (
    user_id TEXT PRIMARY KEY,
    status VARCHAR(20) NOT NULL, -- 'active', 'break', 'finished'
    current_phase VARCHAR(20) NOT NULL, -- 'korean', 'break', 'math', 'finished'
    exam_type VARCHAR(20) NOT NULL, -- 'korean', 'math', 'both'
    remaining_seconds INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.silmo_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to silmo_sessions" 
ON public.silmo_sessions FOR SELECT USING (true);

CREATE POLICY "Allow users to manage their own silmo_sessions" 
ON public.silmo_sessions FOR ALL TO authenticated 
USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- 3. silmo_global_schedules (전역 실모 일정표 테이블) 생성
CREATE TABLE public.silmo_global_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS silmo_global_schedules_date_idx ON public.silmo_global_schedules(date);
ALTER TABLE public.silmo_global_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to silmo_global_schedules" 
ON public.silmo_global_schedules FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert silmo_global_schedules" 
ON public.silmo_global_schedules FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = created_by);
*/
