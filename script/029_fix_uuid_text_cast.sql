-- ====================================================================
-- 029: operator does not exist: uuid = text 오류 완전 수정
-- 
-- [문제] auth.uid()는 uuid 타입을 반환하지만,
--        user_id 컬럼이 TEXT이므로 RLS에서 직접 비교 불가.
--
-- [원인] 026번 마이그레이션에서 테이블을 DROP→RENAME으로 재생성했을 때
--        RLS는 ::text 캐스팅이 적용됐으나,
--        profiles 테이블의 id 컬럼이 UUID 타입인 경우
--        is_silmodan_user() 등 함수에서 auth.uid()::text = id (text) 비교 시
--        profiles.id가 UUID라면 동일한 오류 발생.
--
-- [해결] 모든 RLS 정책과 헬퍼 함수를 일관되게 재생성.
--        profiles.id가 UUID인 경우도 처리.
-- ====================================================================

-- ====================================================
-- Step 1: silmo_records 테이블 존재 확인 및 필수 컬럼 보장
-- ====================================================

-- 혹시 026 마이그레이션이 실행되지 않아 구버전 테이블인 경우를 대비
ALTER TABLE public.silmo_records ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.silmo_records ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE public.silmo_records ADD COLUMN IF NOT EXISTS wrong_numbers TEXT;
ALTER TABLE public.silmo_records ADD COLUMN IF NOT EXISTS is_post_take BOOLEAN NOT NULL DEFAULT false;

-- UNIQUE 제약 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'silmo_records_user_id_title_subject_is_post_take_key'
      AND conrelid = 'public.silmo_records'::regclass
  ) THEN
    ALTER TABLE public.silmo_records
      ADD CONSTRAINT silmo_records_user_id_title_subject_is_post_take_key
      UNIQUE (user_id, title, subject, is_post_take);
  END IF;
END;
$$;

-- ====================================================
-- Step 2: has_taken_exam 헬퍼 함수 재생성 (TEXT 기반으로 안전하게)
-- ====================================================
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

-- ====================================================
-- Step 3: is_silmodan_user 헬퍼 함수 재생성
-- profiles.id가 UUID 또는 TEXT 모두 처리
-- ====================================================
CREATE OR REPLACE FUNCTION public.is_silmodan_user()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_silmodan INTEGER;
BEGIN
  -- profiles.id가 UUID 타입이면 직접 비교, TEXT이면 ::text 캐스팅
  SELECT is_silmodan INTO v_is_silmodan
  FROM public.profiles
  WHERE id::text = auth.uid()::text
  LIMIT 1;
  
  RETURN COALESCE(v_is_silmodan, 0) = 1;
END;
$$;

-- ====================================================
-- Step 4: silmo_records RLS 정책 전체 재설정
-- ====================================================
ALTER TABLE public.silmo_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to silmo_records" ON public.silmo_records;
DROP POLICY IF EXISTS "Allow restricted read access to silmo_records" ON public.silmo_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own silmo_records" ON public.silmo_records;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own silmo_records" ON public.silmo_records;
DROP POLICY IF EXISTS "Allow users to update their own silmo_records" ON public.silmo_records;
DROP POLICY IF EXISTS "Allow users to delete their own silmo_records" ON public.silmo_records;

-- SELECT: 본인 기록 또는 본인이 해당 시험을 치른 경우
CREATE POLICY "Allow restricted read access to silmo_records"
ON public.silmo_records FOR SELECT
USING (
  (auth.uid()::text = user_id)
  OR
  public.has_taken_exam(title, auth.uid()::text)
);

-- INSERT: 본인이거나 silmodan 관리자
CREATE POLICY "Allow authenticated users to insert their own silmo_records"
ON public.silmo_records FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_id
  OR public.is_silmodan_user()
);

-- UPDATE/DELETE: 본인이거나 silmodan 관리자
CREATE POLICY "Allow authenticated users to manage their own silmo_records"
ON public.silmo_records FOR ALL
TO authenticated
USING (
  auth.uid()::text = user_id
  OR public.is_silmodan_user()
)
WITH CHECK (
  auth.uid()::text = user_id
  OR public.is_silmodan_user()
);

-- ====================================================
-- Step 5: silmo_sessions RLS 정책 재설정
-- ====================================================
ALTER TABLE public.silmo_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to silmo_sessions" ON public.silmo_sessions;
DROP POLICY IF EXISTS "Allow users to manage their own silmo_sessions" ON public.silmo_sessions;

CREATE POLICY "Allow public read access to silmo_sessions"
ON public.silmo_sessions FOR SELECT
USING (true);

CREATE POLICY "Allow users to manage their own silmo_sessions"
ON public.silmo_sessions FOR ALL
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- ====================================================
-- Step 6: silmo_global_schedules RLS 정책 재설정
-- ====================================================
ALTER TABLE public.silmo_global_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to silmo_global_schedules" ON public.silmo_global_schedules;
DROP POLICY IF EXISTS "Allow authenticated users to insert silmo_global_schedules" ON public.silmo_global_schedules;
DROP POLICY IF EXISTS "Allow authenticated users to update silmo_global_schedules" ON public.silmo_global_schedules;
DROP POLICY IF EXISTS "Allow authenticated users to delete silmo_global_schedules" ON public.silmo_global_schedules;

CREATE POLICY "Allow public read access to silmo_global_schedules"
ON public.silmo_global_schedules FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to insert silmo_global_schedules"
ON public.silmo_global_schedules FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Allow authenticated users to update silmo_global_schedules"
ON public.silmo_global_schedules FOR UPDATE
TO authenticated
USING (auth.uid()::text = created_by)
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Allow authenticated users to delete silmo_global_schedules"
ON public.silmo_global_schedules FOR DELETE
TO authenticated
USING (auth.uid()::text = created_by);

-- ====================================================
-- 완료 확인용 메시지
-- ====================================================
DO $$ BEGIN
  RAISE NOTICE '✅ 029 migration complete: UUID=TEXT cast fix applied to all RLS policies.';
END $$;
