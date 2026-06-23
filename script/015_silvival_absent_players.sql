-- ============================================================
-- 015_silvival_absent_players.sql
-- silvival_rounds 테이블에 미참여 인원 컬럼 추가
-- absent_players1: exam1 미참여 user_id 배열 (JSONB)
-- absent_players2: exam2 미참여 user_id 배열 (JSONB)
-- ============================================================

ALTER TABLE silvival_rounds
  ADD COLUMN IF NOT EXISTS absent_players1 JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS absent_players2 JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 기존 행에 기본값 적용 (안전)
UPDATE silvival_rounds
  SET absent_players1 = '[]'::jsonb
  WHERE absent_players1 IS NULL;

UPDATE silvival_rounds
  SET absent_players2 = '[]'::jsonb
  WHERE absent_players2 IS NULL;
