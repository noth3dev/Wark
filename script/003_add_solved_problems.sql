-- 푼 문제 테이블 수정 (태그별 구분 추가)
DROP TABLE IF EXISTS solved_problems;

CREATE TABLE solved_problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE SET NULL, -- 어떤 공부 중에 풀었는지 기록
  count INTEGER DEFAULT 0 NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, date, tag_id)
);

-- RLS 설정
ALTER TABLE solved_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own solved problems" ON solved_problems
  FOR ALL USING (auth.uid() = user_id);
