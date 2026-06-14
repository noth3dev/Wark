-- ====================================================================
-- 020: 사후 참가 기록용 컬럼 추가
-- ====================================================================

ALTER TABLE public.silmo_records
  ADD COLUMN IF NOT EXISTS is_post_take BOOLEAN DEFAULT FALSE;
