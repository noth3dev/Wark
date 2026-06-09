-- ====================================================================
-- 전역 실모 RLS(Row Level Security) 정책 변경 SQL 스크립트
-- 자신이 본 시험(동일한 title의 record를 가진 시험)에 한해서만
-- 다른 사람들의 점수를 볼 수 있도록 제한합니다.
-- ====================================================================

-- 1. 무한 재귀를 방지하기 위해 SECURITY DEFINER를 사용하는 헬퍼 함수 생성
-- (SELECT 정책 내에서 동일 테이블 조회 시 발생할 수 있는 Recursion 방지)
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

-- 2. 기존의 전체 공개 SELECT 정책 삭제
DROP POLICY IF EXISTS "Allow public read access to silmo_records" ON public.silmo_records;
DROP POLICY IF EXISTS "Allow restricted read access to silmo_records" ON public.silmo_records;

-- 3. 새로운 제한적 SELECT 정책 생성
-- - 본인의 기록이거나 (user_id = auth.uid()::text)
-- - 본인이 해당 시험(title)을 치른 기록이 존재하는 경우에만 조회 허용
CREATE POLICY "Allow restricted read access to silmo_records" 
ON public.silmo_records FOR SELECT 
USING (
  (auth.uid()::text = user_id)
  OR 
  public.has_taken_exam(title, auth.uid()::text)
);

-- ====================================================================
-- 전역 실모 일정(silmo_global_schedules) 삭제 정책 추가
-- 등록한 본인(created_by = auth.uid()::text)만 삭제가 가능하게 합니다.
-- ====================================================================

-- 4. 기존 삭제 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Allow authenticated users to delete silmo_global_schedules" ON public.silmo_global_schedules;
CREATE POLICY "Allow authenticated users to delete silmo_global_schedules" 
ON public.silmo_global_schedules FOR DELETE 
TO authenticated 
USING (auth.uid()::text = created_by);

-- ====================================================================
-- 5. 프로필(profiles) 테이블에 실모단 가입 여부(is_silmodan) 컬럼 추가
-- ====================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_silmodan INTEGER DEFAULT 0;

