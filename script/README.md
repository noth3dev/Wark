# Database Migration Scripts

이 폴더에는 Supabase 데이터베이스 스키마 및 마이그레이션 SQL 파일들이 포함되어 있습니다.

## 실행 순서

1. **setup.sql** - 초기 데이터베이스 설정
   - `tags` 테이블 생성
   - `study_sessions` 테이블 생성
   - RLS (Row Level Security) 정책 설정

2. **001_add_active_sessions.sql** - 활성 세션 추적 기능 추가
   - `active_sessions` 테이블 생성
   - DB 기준 시간 추적을 위한 헬퍼 함수 추가

## Supabase SQL Editor에서 실행하기

1. Supabase Dashboard → SQL Editor 접속
2. 위 순서대로 각 파일의 SQL을 복사하여 실행
3. 실행 완료 후 Tables 탭에서 테이블 생성 확인

## 주요 개념

### DB 기준 시간 추적

- 클라이언트가 끊겨도 서버 시간 기준으로 정확한 시간 추적
- `active_sessions.start_time` (서버 타임스탬프)
- 현재 시간 - start_time = 경과 시간
