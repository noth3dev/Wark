-- ====================================================================
-- 030: 카페인 목표 농도(caffeine_target) 저장
-- profiles 테이블에 caffeine_target 컬럼 추가
-- ====================================================================

-- profiles 테이블에 목표 카페인 농도 컬럼 추가 (mg, 기본값 80mg)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS caffeine_target NUMERIC(8, 2) DEFAULT 80;

-- ====================================================================
-- RLS: profiles는 이미 본인만 UPDATE 가능하므로 별도 정책 불필요
-- (기존 profiles RLS 정책이 이 컬럼도 커버합니다)
-- ====================================================================

DO $$ BEGIN
  RAISE NOTICE '✅ 030 migration complete: caffeine_target column added to profiles.';
END $$;
