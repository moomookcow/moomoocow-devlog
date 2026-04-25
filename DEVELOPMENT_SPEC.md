# moomoocow-devlog 개발 명세

기준일: 2026-04-22  
버전: v0.5 (에디터 UX 요구사항 반영)

## 1) 목표
- 기술 개발 과정을 장기적으로 축적할 수 있는 개인 DevLog 플랫폼을 구축한다.
- 읽기 경험(가독성, 탐색성, 검색성)과 작성 생산성(어드민 페이지 작성, 배포 자동화)을 동시에 확보한다.
- 디자인/접근성 품질을 초기에 고정해 이후 기능 추가 시 일관성을 유지한다.

## 2) 제품 범위
### 포함
- 포스트 목록 페이지
- 포스트 상세 페이지(MDX 렌더링)
- 어드민 페이지(글 작성/수정/임시저장/발행)
- 태그/카테고리 기반 분류
- 검색(제목/본문/태그 기반)
- RSS/Atom 피드
- SEO 메타, Open Graph, sitemap
- 기본 분석(조회 추이 확인 가능 수준)

### 제외(초기 릴리스 범위 밖)
- 댓글 시스템
- 다국어
- 다중 사용자 권한 시스템(초기에는 단일 관리자 기준)

## 3) 핵심 사용자 시나리오
- 작성자: 어드민 페이지에서 글을 작성/수정하고 임시저장 또는 발행한다.
- 독자: 최신 글, 태그별 글, 특정 주제 검색을 통해 원하는 글에 빠르게 접근한다.
- 운영자(작성자 본인): 배포 실패/품질 이슈를 CI에서 조기에 확인한다.

## 4) 기술 스택(확정)
- 프레임워크: Next.js(App Router) + TypeScript
- 런타임/패키지: Node.js LTS + pnpm
- 데이터 플랫폼: Supabase(PostgreSQL)
- 인증/인가: Supabase Auth(초기 단일 관리자 정책)
- 파일 저장소: Supabase Storage(커버 이미지 등)
- ORM/DB 접근: Prisma
- 콘텐츠 포맷: Markdown/MDX 기반 본문 + 메타데이터 스키마
- 디자인 시스템: shadcn/ui + Radix Primitives + Tailwind CSS + CVA
- 스타일: 디자인 토큰 중심(상세는 `DESIGN.md` 준수)
- 디자인 벤치마크: Hermes Agent Docs(`https://hermes-agent.nousresearch.com/`)를 참고하되 프로젝트 문맥으로 재해석
- 배포: Vercel + Git push 기반 자동 배포
- 품질: 타입 검사, 린트, 테스트, 접근성 점검 자동화

## 5) 디렉터리 초안
아래 구조를 기본 가이드로 사용한다.

```text
/
├─ README.md
├─ DEVELOPMENT_SPEC.md
├─ DESIGN.md
├─ content/
│  └─ posts/ (선택: 마이그레이션/백업 용도)
├─ src/
│  ├─ components/
│  ├─ features/
│  ├─ admin/
│  ├─ pages(or app)/
│  ├─ styles/
│  └─ lib/
├─ prisma/
├─ supabase/
├─ public/
└─ tests/
```

## 6) 데이터 규격
어드민 작성 데이터의 최소 필수 메타 필드:

- `title` (string)
- `slug` (string, unique)
- `date` (ISO 8601)
- `summary` (string)
- `tags` (string[])
- `draft` (boolean)

선택 메타 필드:
- `updatedAt` (ISO 8601)
- `coverImage` (string)
- `series` (string)

### 6-1) 어드민 기능 요구사항
- 글 작성: 제목/요약/본문/태그 입력 지원
- 임시저장: `draft=true` 상태로 저장하고 공개 페이지 비노출
- 발행: `draft=false`로 전환하며 공개 목록에 반영
- 수정/삭제: 기존 글 편집 및 삭제(또는 소프트 삭제) 지원
- 유효성 검사: 필수 필드 누락 시 저장/발행 차단
- 인증 보호: Supabase Auth 세션 없는 사용자는 `/admin` 접근 불가
- 에디터 UX: Velog 스타일(마크다운 중심 편집 + 실시간/근실시간 미리보기 + 제목/본문 분리 입력)로 제공
- 에디터 기본 툴바: 헤딩, 볼드, 이탤릭, 링크, 코드블록, 인용, 목록, 이미지 입력 지원

## 7) 단계별 개발 계획
### Phase 0. 프로젝트 부트스트랩
- 프로젝트 초기화
- 라우팅/레이아웃/글로벌 스타일 구성
- 디자인 토큰 베이스 연결
- CI 기본 파이프라인 설정
- Supabase 프로젝트/환경변수/로컬 개발 연결
- 어드민 라우트 및 인증 골격 구성

완료 조건:
- 로컬 개발 서버 실행 가능
- 기본 페이지 1개 이상 배포 환경에서 확인 가능

### Phase 1. 콘텐츠 파이프라인
- 어드민 작성/수정/임시저장/발행 기능 구현
- Velog 스타일 에디터 UI 1차 구현(편집/미리보기 전환 또는 분할 보기)
- Prisma 스키마/마이그레이션 구성 및 Supabase Postgres 연동
- 포스트 메타데이터 파싱 및 검증
- 목록/상세 페이지 생성
- draft 처리(운영 환경 비노출)

완료 조건:
- 어드민에서 작성한 샘플 포스트 3개 이상 렌더링
- 잘못된 메타데이터 스키마를 CI에서 실패 처리
- 비인가 사용자는 어드민 접근 불가
- Supabase DB에서 작성/조회/수정 플로우 정상 동작
- 에디터에서 작성한 Markdown 본문이 공개 상세 페이지에서 의도한 서식으로 렌더링

### Phase 2. 탐색 기능
- 태그 페이지
- 검색 기능
- 이전/다음 글 네비게이션
- 목차(TOC) 및 헤더 앵커

완료 조건:
- 키보드만으로 목록-상세-태그-검색 흐름 탐색 가능
- 검색 응답 시간 목표 충족(초기 기준: 일반 포스트 규모에서 체감 즉시)

### Phase 3. 퍼블리싱 품질
- SEO 메타/OG/Twitter Card
- sitemap, robots, RSS/Atom 생성
- 접근성 점검 및 성능 최적화

완료 조건:
- 핵심 페이지 Lighthouse 접근성/성능 목표치 달성
- 공유 미리보기(OG) 정상 노출 확인

### Phase 4. 운영 안정화
- 에러 모니터링/분석 도입
- 배포 체크리스트 고도화
- 회귀 테스트 보강

완료 조건:
- 배포 실패 원인 추적 가능
- 핵심 사용자 흐름에 대한 회귀 테스트 보유

## 8) 품질 기준(Definition of Done)
모든 기능 PR은 아래를 만족해야 한다.

- 타입 검사/린트/테스트 통과
- 접근성 요구사항 충족(`DESIGN.md`의 WCAG 2.2 AA 기준)
- 반응형(모바일/데스크톱) 레이아웃 검증
- 문서 업데이트(기능 변경 시 README 또는 본 명세 반영)
- 회귀 리스크 및 롤백 전략 명시

## 9) 협업/운영 규칙
- 브랜치 전략: `main` 보호 + 기능 브랜치
- 커밋 단위: 기능 단위로 작게 유지
- PR 템플릿: 문제/해결/테스트/리스크 필수
- 이슈 관리: 구현 전 Acceptance Criteria 먼저 작성

## 10) 리스크와 대응
- 리스크: 초기 설계 과도화로 개발 속도 저하
  - 대응: Phase 단위로 범위를 고정하고 다음 단계에서 확장
- 리스크: 디자인 규칙과 실제 구현 불일치
  - 대응: 컴포넌트 PR마다 토큰 사용 검토 체크리스트 적용
- 리스크: 콘텐츠 메타데이터 불일치
  - 대응: 메타데이터 스키마 검증을 CI 필수 단계로 고정

## 11) 다음 실행 항목
개발 시작 시 아래 순서로 진행한다.

1. 프레임워크/패키지 매니저 최종 확정
2. Phase 0 스캐폴딩 + 어드민 인증 골격 구성
3. 어드민에서 샘플 포스트 3개 작성 후 Phase 1 검증
4. 검색/태그 등 탐색 기능 구현(Phase 2)
5. SEO/피드/품질 고도화(Phase 3~4)

## 12) 환경변수 정책
필수 키:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server-only)
- `DATABASE_URL`
- `ADMIN_EMAIL_ALLOWLIST`

권장 키:
- `ADMIN_GITHUB_ALLOWLIST` (GitHub OAuth admin allowlist)
- `DIRECT_URL` (Prisma migrate)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (인증 구현 선택 시)

환경 분리 규칙:
- `dev`, `staging`, `prod`는 서로 다른 데이터 리소스를 사용해야 한다.
- 운영 환경 비밀키는 CI Secret 또는 배포 플랫폼 Secret에만 저장해야 한다.
- `SUPABASE_SECRET_KEY`는 클라이언트 코드에서 참조하면 안 된다.
- 레거시 `anon/service_role` 키는 전환기 호환용으로만 사용하고 신규 구성은 `publishable/secret`을 기본으로 해야 한다.

## 13) 어드민 인증/인가 상세 정책
인증:
- Supabase Auth 기반 로그인(GitHub OAuth provider)은 반드시 지원해야 한다.
- 로그인 세션 만료 시 재로그인을 요구해야 한다.

인가:
- `ADMIN_EMAIL_ALLOWLIST` 또는 `ADMIN_GITHUB_ALLOWLIST`에 등록된 계정만 관리자 권한을 가져야 한다.
- 비인가 계정의 `/admin/*` 요청은 `/admin/login`으로 리다이렉트해야 한다.
- 관리자 API/Server Action은 세션 검증 + allowlist 검증을 모두 통과해야 한다.

운영:
- 초기 운영자는 1명이며, 운영자 변경 시 allowlist 업데이트 절차를 문서화해야 한다.
- 모든 관리자 변경(발행/삭제)은 서버 로그 기준으로 추적 가능해야 한다.

## 14) 데이터 모델 초안 (Prisma/Supabase)
### 14-1) Post
- `id` (uuid, PK)
- `title` (string, required)
- `slug` (string, unique, required)
- `summary` (string, required)
- `contentMdx` (text, required)
- `status` (enum: `draft` | `published`)
- `publishedAt` (datetime, nullable)
- `updatedAt` (datetime, required)
- `coverImagePath` (string, nullable)
- `authorId` (uuid, required)

### 14-2) Tag
- `id` (uuid, PK)
- `name` (string, unique, required)
- `slug` (string, unique, required)

### 14-3) PostTag
- `postId` (FK -> Post.id)
- `tagId` (FK -> Tag.id)
- unique composite key: (`postId`, `tagId`)

### 14-4) Slug 정책
- slug는 소문자 kebab-case로 정규화해야 한다.
- 충돌 시 `-2`, `-3` suffix를 순차적으로 부여해야 한다.
- 발행된 slug 변경 시 301 리다이렉트 매핑을 남겨야 한다.

## 15) API / Server Action 계약 (초안)
### 15-1) Admin Post Create
- action: `createPost`
- input: `title`, `summary`, `contentMdx`, `tags[]`, `status`
- output: `postId`, `slug`, `status`
- error: `400(validation)`, `401(unauthenticated)`, `403(forbidden)`, `409(slug_conflict)`

### 15-2) Admin Post Update
- action: `updatePost`
- input: `postId` + 변경 필드
- output: `postId`, `updatedAt`
- error: `400`, `401`, `403`, `404(post_not_found)`

### 15-3) Admin Post Publish/Unpublish
- action: `publishPost`, `unpublishPost`
- input: `postId`
- output: `postId`, `status`, `publishedAt`
- error: `401`, `403`, `404`

### 15-4) Admin Post Delete
- action: `deletePost`
- input: `postId`
- output: `postId`, `deleted=true`
- 정책: 초기에는 soft delete 우선
- error: `401`, `403`, `404`

## 16) 배포/운영 체크리스트
배포 전:
1. 마이그레이션 파일 검토(파괴적 변경 여부 확인)
2. 환경변수 누락 여부 확인
3. 타입체크/린트/테스트 통과 확인

배포 중:
1. DB 마이그레이션 적용(Prisma 스키마 변경이 포함된 릴리스에서만 `pnpm prisma migrate deploy` 실행)
2. 애플리케이션 배포
3. 헬스체크(홈/포스트상세/어드민로그인) 수행

배포 후:
1. 에러 로그/알림 확인(초기 30분)
2. 관리자 작성/발행 플로우 스모크 테스트
3. 필요 시 직전 릴리스로 롤백

롤백 기준:
- 로그인 불가, 포스트 조회 불가, 발행 불가 중 1개 이상 발생 시 즉시 롤백 검토

## 17) 테스트 전략
단위(Unit):
- slug 생성 규칙
- 메타데이터 유효성 검사
- 권한 체크 유틸

통합(Integration):
- 어드민 작성/수정/발행 Server Action
- Supabase DB CRUD 및 트랜잭션 경계

E2E:
- 비로그인 사용자 `/admin` 접근 차단
- 관리자 로그인 -> 포스트 작성 -> 발행 -> 공개 페이지 노출
- 태그/검색/상세 페이지 탐색

최소 커버 범위:
- 핵심 흐름(로그인, 작성, 발행, 조회)은 회귀 테스트를 항상 가져야 한다.
