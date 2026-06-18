-- ====================================================================
-- 028: silmo_records INSERT 정책 수정
-- 대항전(round) 종료 시 관리자(silmodan)가 다른 유저의 점수를
-- silmo_records에 upsert할 수 있도록 정책을 완화합니다.
-- ====================================================================

-- is_silmodan 여부 확인 헬퍼 함수
CREATE OR REPLACE FUNCTION public.is_silmodan_user()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()::text
      AND is_silmodan = 1
  );
END;
$$;

-- 기존 INSERT 정책 삭제
DROP POLICY IF EXISTS "Allow authenticated users to insert their own silmo_records" ON public.silmo_records;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own silmo_records" ON public.silmo_records;

-- 새 INSERT 정책: 본인 데이터이거나 silmodan이면 허용
CREATE POLICY "Allow authenticated users to insert their own silmo_records"
ON public.silmo_records FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_id
  OR public.is_silmodan_user()
);

-- 새 UPDATE/DELETE 정책: 본인 데이터이거나 silmodan이면 허용
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
