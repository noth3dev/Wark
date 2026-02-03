-- 푼 문제 로그 테이블 (시간별 추적용)
CREATE TABLE solved_problem_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS 설정
ALTER TABLE solved_problem_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own solved problem logs" ON solved_problem_logs
  FOR ALL USING (auth.uid() = user_id);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX idx_solved_logs_user_date ON solved_problem_logs(user_id, created_at);
