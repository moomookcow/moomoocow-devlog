# moomoocow-devlog

기술 개발 과정을 기록하는 블로그 프로젝트입니다.  
현재 저장소는 구현 전 단계이며, 아래 문서를 기준으로 개발을 진행합니다.

## 문서 구성
- [개발 명세](./DEVELOPMENT_SPEC.md): 개발 목표, 범위, 단계별 계획, 완료 기준
- [디자인 원칙](./DESIGN.md): UI 토큰/접근성/컴포넌트 규칙

## 현재 상태
- 코드베이스 초기화 전
- 명세 정리 및 개발 방향 수립 단계

## 확정 기술 스택
- Next.js(App Router) + TypeScript
- Supabase(PostgreSQL/Auth/Storage) + Prisma
- Vercel 배포

## 환경변수(초안)
아래 키는 `.env.local` 기준이며, 민감값은 커밋하면 안 됩니다.

| Key | Scope | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | dev/staging/prod | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | dev/staging/prod | Supabase publishable key (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | server-only | 서버 전용 secret key (`sb_secret_...`) |
| `DATABASE_URL` | server-only | Prisma용 Postgres 연결 문자열 |
| `DIRECT_URL` | server-only(optional) | Prisma migrate 전용 direct 연결 문자열 |
| `ADMIN_EMAIL_ALLOWLIST` | server-only | 어드민 접근 허용 이메일 목록(콤마 구분) |
| `NEXTAUTH_URL` | dev/staging/prod(optional) | 배포 URL 기반 인증 콜백 보조 값 |
| `NEXTAUTH_SECRET` | server-only(optional) | 세션 서명 키(인증 구현 선택 시) |

참고:
- 스테이징/프로덕션은 환경별로 Supabase 프로젝트를 분리해야 합니다.
- `SUPABASE_SECRET_KEY`는 클라이언트 번들에 포함되면 안 됩니다.
- 레거시 키(`anon`, `service_role`)는 호환 기간에만 사용하고 신규 구성은 `publishable/secret`을 기본으로 해야 합니다.

## 어드민 인증 정책(요약)
- 초기 정책은 단일 관리자(1인 운영) 기준입니다.
- 로그인 성공 후 이메일이 `ADMIN_EMAIL_ALLOWLIST`에 포함되어야 `/admin` 접근이 가능합니다.
- 비인가 사용자는 `/admin/login`으로 리다이렉트해야 합니다.
- 세션 만료 시 재로그인 후 직전 페이지로 복귀해야 합니다.

## 빠른 시작(예정)
아래 항목은 개발 명세 기준으로 순차 적용합니다.
- 프로젝트 스캐폴딩 및 라우팅 구조 생성
- 어드민 페이지(글 작성/수정/임시저장/발행) 구성
- 포스트 데이터 모델 및 콘텐츠 파이프라인 구성
- 목록/상세/태그/검색/SEO/피드 기능 구현
- 접근성, 성능, 배포 자동화 구축

## 운영 배포 커맨드(중요)
- 스키마 변경이 있을 때만(Prisma migration 파일이 추가된 배포):
  - `pnpm prisma migrate deploy`
- 일반 글 작성/수정/발행 배포에서는 실행 불필요
  - 이유: 데이터 레코드 변경은 앱 기능으로 처리되고, `migrate deploy`는 DB 구조 변경용이기 때문

## 문서 우선순위
- 구현/운영 기준: [개발 명세](./DEVELOPMENT_SPEC.md)
- 디자인/토큰/접근성 기준: [디자인 원칙](./DESIGN.md)
