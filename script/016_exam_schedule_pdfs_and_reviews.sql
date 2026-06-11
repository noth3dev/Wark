-- ====================================================================
-- 016: 전역 실모 일정 PDF 첨부 + 종료 플래그, 총평(Review) 테이블 추가
-- ====================================================================

-- 1. silmo_global_schedules 에 PDF URL 및 is_closed 컬럼 추가
ALTER TABLE public.silmo_global_schedules
  ADD COLUMN IF NOT EXISTS question_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS solution_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS is_closed BOOLEAN NOT NULL DEFAULT false;

-- 2. 총평(Review) 테이블 생성
--    제목(=시험명) 기준으로 최고점자가 총평 PDF를 업로드
CREATE TABLE IF NOT EXISTS public.silmo_schedule_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_title TEXT NOT NULL UNIQUE,   -- 시험명(title) 기준 1개만
    uploader_id TEXT NOT NULL,             -- 업로더 user_id
    review_pdf_url TEXT NOT NULL,          -- Storage URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.silmo_schedule_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to silmo_schedule_reviews" ON public.silmo_schedule_reviews;
CREATE POLICY "Allow public read access to silmo_schedule_reviews"
ON public.silmo_schedule_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to upsert silmo_schedule_reviews" ON public.silmo_schedule_reviews;
CREATE POLICY "Allow authenticated users to upsert silmo_schedule_reviews"
ON public.silmo_schedule_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = uploader_id);

DROP POLICY IF EXISTS "Allow authenticated users to update own silmo_schedule_reviews" ON public.silmo_schedule_reviews;
CREATE POLICY "Allow authenticated users to update own silmo_schedule_reviews"
ON public.silmo_schedule_reviews FOR UPDATE TO authenticated
USING (auth.uid()::text = uploader_id);

-- 3. silmo_global_schedules 업데이트 정책 추가 (is_closed 업데이트를 위해)
DROP POLICY IF EXISTS "Allow authenticated users to update silmo_global_schedules" ON public.silmo_global_schedules;
CREATE POLICY "Allow authenticated users to update silmo_global_schedules"
ON public.silmo_global_schedules FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);
