-- ====================================================================
-- 017: 틀린 문항 번호 기록용 컬럼 추가
-- ====================================================================

ALTER TABLE public.silmo_records
  ADD COLUMN IF NOT EXISTS korean_wrong_numbers TEXT,
  ADD COLUMN IF NOT EXISTS math_wrong_numbers TEXT;
