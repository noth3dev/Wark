-- 1. 태그 테이블 생성
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#ffffff',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(name, user_id)
);

-- 2. 학습 세션 테이블 수정 (태그 연결 추가)
-- 기존 테이블이 있다면 삭제 후 재생성하거나 또는 아래와 같이 수정
DROP TABLE IF EXISTS study_sessions;

CREATE TABLE study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE SET NULL,
  duration BIGINT NOT NULL DEFAULT 0, -- 밀리초(ms) 단위
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. RLS 설정
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Tags 정책
CREATE POLICY "Users can manage their own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

-- Study Sessions 정책
CREATE POLICY "Users can manage their own sessions" ON study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 4. 초기 기본 태그 자동 생성을 위한 함수 (선택 사항)
-- 사용자가 회원가입할 때 기본 태그를 넣어주고 싶다면 사용하세요.
