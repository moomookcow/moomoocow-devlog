# moomoocow-devlog

개인 기술 개발 과정을 기록하는 DevLog 프로젝트입니다.  
구현 전에 기획/명세를 먼저 고정하고, 단계적으로 개발합니다.

## 1) 목표
- 작성자 관점: 관리자 페이지에서 글 작성/수정/출간을 빠르고 안정적으로 처리한다.
- 독자 관점: 목록/상세/카테고리/TOC를 통해 글을 쉽게 탐색하고 읽는다.
- 운영 관점: 반응형, 인증 안정성, 배포 품질을 초기에 고정한다.

## 2) 핵심 제품 요구사항

### 공통 UI/UX
- 다크모드 전환 토글 제공
- 헤더/콘텐츠/푸터 레이아웃 고정
- 모바일 웹앱 환경에서 깨짐 없는 반응형 지원

### 루트 페이지(`/`)
- 좌/우 사이드바에 `카테고리`, `인기 글`, `최근 글`, `최근 댓글` 노출
- 메인 영역은 블로그 글 카드 목록이 중심
- 상단 또는 메인 영역에 검색 입력창 제공(게시글 검색)

### 게시글 상세 페이지(`/posts/[slug]`)
- 상단 정보: 제목, 작성자, 작성일, 공유 링크, 태그
- 현재 카테고리 글 목록을 함께 표시
- 현재 읽는 글은 목록에서 볼드 처리
- 카테고리 목록 항목은 링크 이동 가능
- 우측 `Table of Contents` 제공
- 카테고리 사이드바는 상세 페이지에서도 유지
- 하단에 `이전 포스트`, `다음 포스트` 내비게이션 제공
- 댓글 작성 UI/기능 제공

### 관리자 대시보드(`/admin`)
- 카테고리, 인기 글, 최근 글, 최근 댓글 섹션 제공
- 중앙 핵심 영역에 `글 관리` 목록 제공
- 상단 액션: `카테고리 관리`, `새 글`, `로그아웃`
- 글 카드마다 `편집` 버튼 제공

### 카테고리 관리
- 카테고리 추가/삭제
- 카테고리 이름 수정
- 카테고리 순서 변경

### 새 글/수정/출간 UX
- 작성/수정 화면은 Velog 스타일 편집기(좌: 마크다운, 우: 미리보기)
- 출간/수정 시 즉시 반영이 아니라 다이얼로그를 통해 최종 정보 입력
- 다이얼로그 입력 필드:
  - 썸네일 이미지(업로드 또는 URL)
  - 제목
  - 소개글
  - 공개 설정
  - 카테고리 지정
- 다이얼로그의 `출간하기` 실행 시 최종 저장/전송

## 3) 기술 방향(확정)
- Frontend: Next.js(App Router) + TypeScript + Tailwind + shadcn/ui
- Auth/DB: Supabase(Auth + Postgres 직접 사용)
- ORM: 사용하지 않음(Prisma 미사용)
- 배포: Vercel + 커스텀 도메인(`hellomook.com`)

## 4) 데이터 설계(초안)
- `posts`
  - `id`, `title`, `slug(unique)`, `summary`, `content_mdx`, `status(draft|published)`, `published_at`, `created_at`, `updated_at`, `author`, `thumbnail_url`, `visibility`, `category_id`
- `categories`
  - `id`, `name(unique)`, `slug(unique)`, `sort_order`
- `tags`
  - `id`, `name(unique)`, `slug(unique)`
- `post_tags`
  - `post_id`, `tag_id`, composite unique(`post_id`, `tag_id`)
- `comments` (1차 MVP 범위)
  - `id`, `post_id`, `author_name`, `content`, `created_at`, `status`

## 5) 핵심 사용자 흐름
1. 관리자 로그인
2. `/admin` 대시보드 진입
3. `새 글` 클릭 → 작성 화면 진입
4. 제목/태그/본문 작성(미리보기 확인)
5. `출간` 클릭 → 출간 다이얼로그 입력
6. 출간 완료 후 공개 목록/상세에 반영
7. 독자는 루트/목록/상세에서 탐색, 상세 하단에서 댓글 작성

## 6) 단계별 개발 계획

### Phase 0. 기반 안정화
- 인증/인가 플로우 안정화(`/admin/login -> /admin -> /admin/new`)
- 반응형 레이아웃 프레임(헤더/콘텐츠/푸터)
- 다크모드 토글 기본 구조

완료 기준:
- 로그인/로그아웃/비인가 차단이 3회 연속 안정 동작
- 모바일/데스크톱 공통 레이아웃 깨짐 없음

### Phase 1. 데이터 모델 및 작성 기능
- `posts/categories/tags/post_tags/comments` 스키마 생성
- 글 작성/임시저장/출간 서버 액션 연결
- slug 중복 처리/유효성 검증

완료 기준:
- 작성/임시저장/출간 데이터가 DB에 정확히 반영
- 필수값 누락 시 저장 차단

### Phase 2. 관리자 기능 고도화
- 대시보드 실데이터 연결(카테고리/인기/최근/댓글)
- 글 관리 리스트 + 편집 버튼
- 카테고리 관리(추가/수정/삭제/순서변경)
- 출간 다이얼로그(썸네일/URL/소개글/공개설정/카테고리)

완료 기준:
- 관리자 화면에서 작성부터 편집/출간까지 완결

### Phase 3. 공개 페이지 완성
- 루트 페이지(사이드바 + 글카드 + 검색)
- 상세 페이지(상단 메타/카테고리 목록/TOC/이전·다음 글/댓글)
- draft 비노출 정책 적용

완료 기준:
- published 글만 공개 노출
- 루트/상세 핵심 탐색 흐름 완성

### Phase 4. 운영 품질
- 배포 체크리스트/스모크 테스트 문서화
- 오류 처리/빈 상태/로딩 상태 정리
- 접근성/성능 기본 점검

완료 기준:
- 운영 도메인 기준 E2E 통과
- 기본 품질 게이트(타입/린트) 항상 통과

## 7) 운영 규칙
- 민감값은 `.env.local`/Vercel Env로만 관리
- `.env*`는 Git에 커밋하지 않음
- 기능 단위로 작은 커밋 유지

## 8) 환경변수
```bash
cp .env.example .env.local
```

필수:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ADMIN_EMAIL_ALLOWLIST`

선택:
- `SUPABASE_SECRET_KEY`
- `ADMIN_GITHUB_ALLOWLIST` (현재 플로우에서는 미사용)

## 9) 지금 바로 할 일
- [ ] Phase 0 완료: 인증 리다이렉트 안정성 + 모바일 레이아웃 점검
- [ ] Phase 1 시작: DB 스키마 생성 및 글 작성 서버 액션 연결
- [ ] 루트/상세 IA(사이드바/TOC/댓글) 화면 설계 확정

## 10) 개발 커맨드
```bash
pnpm dev
pnpm lint
pnpm exec tsc --noEmit
```

