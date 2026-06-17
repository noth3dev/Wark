-- ====================================================================
-- 026: silmo_records 테이블을 subject-based(과목별 행) 유연한 구조로 리팩토링
-- ====================================================================

-- 1. 임시 백업 테이블 생성 및 기존 데이터 복사
CREATE TABLE IF NOT EXISTS public.silmo_records_backup AS 
SELECT * FROM public.silmo_records;

-- 2. 신규 구조의 silmo_records_new 테이블 생성
CREATE TABLE IF NOT EXISTS public.silmo_records_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '실전 모의고사',
    type VARCHAR(20) NOT NULL, -- 'korean', 'math', 'both', 'explore' 등 전체 시험의 원래 유형
    subject TEXT NOT NULL,      -- 'korean', 'math', 'explore' 등 개별 과목명
    score INTEGER NOT NULL,
    wrong_numbers TEXT,
    is_post_take BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, title, subject, is_post_take)
);

-- 3. 기존 데이터 마이그레이션 (korean_score -> korean subject, math_score -> math subject)
-- 3-1. 국어 점수 마이그레이션
INSERT INTO public.silmo_records_new (user_id, title, type, subject, score, wrong_numbers, is_post_take, created_at)
SELECT 
    user_id, 
    title, 
    type, 
    'korean' AS subject, 
    korean_score AS score, 
    korean_wrong_numbers AS wrong_numbers, 
    COALESCE(is_post_take, FALSE) AS is_post_take, 
    created_at
FROM public.silmo_records
WHERE korean_score IS NOT NULL;

-- 3-2. 수학 점수 마이그레이션
INSERT INTO public.silmo_records_new (user_id, title, type, subject, score, wrong_numbers, is_post_take, created_at)
SELECT 
    user_id, 
    title, 
    type, 
    'math' AS subject, 
    math_score AS score, 
    math_wrong_numbers AS wrong_numbers, 
    COALESCE(is_post_take, FALSE) AS is_post_take, 
    created_at
FROM public.silmo_records
WHERE math_score IS NOT NULL;

-- 4. 기존 테이블 드롭 및 신규 테이블로 이름 변경
DROP TABLE IF EXISTS public.silmo_records CASCADE;
ALTER TABLE public.silmo_records_new RENAME TO silmo_records;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS silmo_records_user_id_idx ON public.silmo_records(user_id);
CREATE INDEX IF NOT EXISTS silmo_records_title_idx ON public.silmo_records(title);

-- 6. RLS(Row Level Security) 설정 재적용
ALTER TABLE public.silmo_records ENABLE ROW LEVEL SECURITY;

-- 6-1. 무한 재귀 방지 헬퍼 함수 재생성
CREATE OR REPLACE FUNCTION public.has_taken_exam(exam_title TEXT, user_uuid TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.silmo_records 
    WHERE title = exam_title AND user_id = user_uuid
  );
END;
$$;

-- 6-2. SELECT RLS 정책 적용
DROP POLICY IF EXISTS "Allow restricted read access to silmo_records" ON public.silmo_records;
CREATE POLICY "Allow restricted read access to silmo_records" 
ON public.silmo_records FOR SELECT 
USING (
  (auth.uid()::text = user_id)
  OR 
  public.has_taken_exam(title, auth.uid()::text)
);

-- 6-3. INSERT RLS 정책 적용
DROP POLICY IF EXISTS "Allow authenticated users to insert their own silmo_records" ON public.silmo_records;
CREATE POLICY "Allow authenticated users to insert their own silmo_records" 
ON public.silmo_records FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

-- 6-4. UPDATE/DELETE RLS 정책 적용 (혹시 모를 관리용)
DROP POLICY IF EXISTS "Allow authenticated users to manage their own silmo_records" ON public.silmo_records;
CREATE POLICY "Allow authenticated users to manage their own silmo_records" 
ON public.silmo_records FOR ALL 
TO authenticated 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);
