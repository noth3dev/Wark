-- ============================================================
-- 031_silvival_meta_column.sql
-- silvival_rounds 테이블에 범용 meta JSONB 컬럼 추가
--
-- 기존 컬럼 방식(absent_players1/2 등)으로 매번 ALTER TABLE
-- 하지 않아도 되도록, 확장 데이터는 전부 meta 안에 저장합니다.
--
-- meta 안에 저장될 주요 키 (문서화 목적):
--   absent_players1  : string[]  — exam1 미참여 user_id 목록
--   absent_players2  : string[]  — exam2 미참여 user_id 목록
--   (추후 필드는 meta 안에 자유롭게 추가)
-- ============================================================

ALTER TABLE public.silvival_rounds
  ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 기존 행 안전 초기화
UPDATE public.silvival_rounds
  SET meta = '{}'::jsonb
  WHERE meta IS NULL;

COMMENT ON COLUMN public.silvival_rounds.meta IS
  'Extensible JSON bag for round-level metadata. '
  'Current keys: absent_players1 (string[]), absent_players2 (string[]).';
