# ⏱️ Study Timer

DB 기준 시간 추적을 사용하는 Next.js 기반 학습 타이머 애플리케이션

## ✨ 주요 기능

- 🎯 **DB 기준 시간 추적**: 클라이언트가 끊겨도 정확한 시간 기록
- 🏷️ **태그 시스템**: 다양한 학습 활동을 태그로 분류
- 📊 **일일 통계**: 태그별 오늘 학습 시간 자동 집계
- 🎨 **커스터마이징**: 태그 색상 및 아이콘 설정
- 🔐 **Supabase 인증**: 안전한 사용자 인증 및 데이터 관리

## 🏗️ 아키텍처

### DB 기준 시간 추적

기존 localStorage 방식의 문제점을 해결하기 위해 **서버 타임스탬프 기반** 추적 도입:

```
태그 클릭 → active_sessions 테이블에 start_time 기록 (DB NOW())
         ↓
다른 태그 클릭 → 현재 세션 종료 & 저장
         ↓
study_sessions에 duration 저장 (NOW() - start_time)
```

**장점:**
- ✅ 클라이언트 재연결 시에도 정확한 시간 유지
- ✅ 여러 기기 간 동기화 가능
- ✅ 서버 시간 기준으로 데이터 무결성 보장

## 🚀 시작하기

### 1. 환경 설정

`.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 데이터베이스 설정

Supabase SQL Editor에서 `/script` 폴더의 SQL 파일들을 순서대로 실행:

1. `setup.sql` - 기본 테이블 생성
2. `001_add_active_sessions.sql` - 활성 세션 추적 기능 추가

자세한 내용은 [`/script/README.md`](./script/README.md) 참고

### 3. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속

## 📁 프로젝트 구조

```
timer/
├── app/              # Next.js App Router
├── components/       # React 컴포넌트
│   ├── stopwatch/   # 타이머 관련 서브 컴포넌트
│   └── ui/          # UI 컴포넌트
├── lib/             # 유틸리티 & 헬퍼
├── script/          # 데이터베이스 마이그레이션 SQL
└── public/          # 정적 파일
```

## 🔧 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion

## 📝 License

MIT

