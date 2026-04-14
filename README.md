# ⏱️ Study Timer

DB 기준 시간 추적과 아이콘 기반 태그 시스템을 사용하는 Next.js 기반 학습 타이머 애플리케이션

## ✨ 주요 기능

- 🎯 **DB 기준 시간 추적**: 서버 타임스탬프를 사용하여 클라이언트 상태와 무관하게 정확한 시간 기록
- 🏷️ **아이콘 기반 태그 시스템**: 도트 형태에서 벗어나 아이콘 중심의 시각적 식별 시스템 (Lucide Icons)
- 🎨 **커스터마이징**: 태그별 아이콘과 색상을 독립적으로 설정 가능한 프리미엄 모달 UI
- 📊 **지능형 통계 (Analytics)**: 태그 그룹화 및 DB 연동 그룹 이름을 통한 고도화된 학습 분석
- 🗓️ **주간 과제 관리**: 주차별 과제 관리 및 과제와 타이머 간의 실시간 연동 (Sync)
- 🔐 **Supabase 인증**: 안전한 사용자 인증 및 고속 데이터 동기화

## 🏗️ 아키텍처 및 디자인 시스템

### 1. 아이콘 중심의 아이덴티티 (Icon-First Design)
기존의 단순 컬러 도트 시스템을 폐지하고, 모든 학습 활동을 **아이콘(Symbol)**으로 정의합니다. 이는 사용자의 인지 부하를 줄이고 학습 데이터의 시각적 분류를 명확하게 합니다.

### 2. 모듈화된 UI 컴포넌트
애플리케이션의 복잡성을 관리하기 위해 핵심 화면을 독립적인 컴포넌트로 분리했습니다:
- `HomeworkHeader`: 주차 네비게이션 및 전체 진행률 대시보드
- `StatsDonut`: 24시간 활동 주기 및 태그별 점유율 도넛 차트
- `ActivityList`: 상세 기록 타임라인 및 태그별 요약

### 3. DB 기준 시간 추적 (Server-Side Tracking)
데이터 무결성을 위해 모든 세션은 서버 시간을 기준으로 기록됩니다:
- 태그 클릭 시 `active_sessions`에 기록 시작
- 세션 종료 시 서버 NOW()와 비교하여 `duration` 계산
- 기기 간 상태 동기화 및 네트워크 환경에 강한 복원력 제공

## 🚀 시작하기

### 1. 환경 설정
`.env.local` 파일 생성:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 데이터베이스 설정
Supabase SQL Editor에서 `/script` 폴더의 SQL 파일들을 순서대로 실행하세요. `tag_groups` 테이블이 추가되어 아이콘별 커스텀 이름을 지원합니다.

### 3. 의존성 설치 및 실행
```bash
npm install
npm run dev
```

## 🔧 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Design**: Icon-Based Design System with Lucide
- **Styling**: Tailwind CSS / Vanilla CSS
- **Animation**: Framer Motion

## 📁 프로젝트 구조

```
timer/
├── app/              # Next.js App Router
├── components/       # 모듈화된 UI 컴포넌트
│   ├── homework/    # 주차 과제 및 통계 컴포넌트
│   ├── stopwatch/   # 타이머 핵심 컴포넌트
│   └── record/      # 분석 및 통계 대시보드 컴포넌트
├── lib/             # 서비스(Service) 및 유틸리티
├── hooks/           # 도메인별 커스텀 훅 (useRecord, useStopwatch 등)
└── script/          # DB 스키마 및 마이그레이션 SQL
```

## 📝 License
MIT
