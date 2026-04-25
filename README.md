# moomoocow-devlog TODO

기획/개발 진행표입니다.  
디자인 시스템 상세: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

## 0) 프로젝트 원칙
- [ ] 다크모드 토글 제공
- [ ] 헤더/콘텐츠/푸터 공통 레이아웃 유지
- [ ] 모바일 웹앱 반응형 깨짐 없음
- [ ] 주요 한글 타이틀/헤딩은 Song Myung 적용
- [ ] 본문/폼/메타는 Noto Sans KR 유지
- [ ] input/button/textarea/select/dialog 등 인터랙션 요소는 shadcn/ui 기반으로만 구현
- [ ] raw HTML 컨트롤 직접 사용 금지(공용 UI 컴포넌트로 래핑)
- [ ] 대부분 컴포넌트는 shadcn/ui를 사용하되 최종 스타일은 디자인 시스템 토큰에 맞춰 커스터마이즈

## 1) 루트 페이지(`/`)
- [ ] 좌/우 사이드바: 카테고리/인기 글/최근 글/최근 댓글
- [ ] 메인 영역: 블로그 글 카드 목록
- [ ] 검색 입력창 제공(게시글 검색)
- [ ] 로딩 스켈레톤 구성

## 2) 게시글 상세(`/posts/[slug]`)
- [ ] 상단: 제목/작성자/작성일/공유 링크/태그
- [ ] 현재 카테고리 글 목록 표시
- [ ] 현재 글 볼드 처리 + 링크 이동
- [ ] 우측 TOC 제공
- [ ] 카테고리 사이드바 유지
- [ ] 하단 이전/다음 포스트
- [ ] 댓글 작성 UI/기능
- [ ] 상세 로딩 스켈레톤(제목/본문/TOC/이전·다음)

## 3) 관리자 대시보드(`/admin`)
- [ ] 카테고리/인기 글/최근 글/최근 댓글 섹션
- [ ] 중앙 `글 관리` 목록
- [ ] 상단 액션: 카테고리 관리/새 글/로그아웃
- [ ] 글 카드별 편집 버튼
- [ ] 대시보드 로딩 스켈레톤

## 4) 카테고리 관리
- [ ] 카테고리 추가
- [ ] 카테고리 삭제
- [ ] 카테고리 이름 수정
- [ ] 카테고리 순서 변경

## 5) 새 글/수정/출간 UX (`/admin/new`)
- [ ] Velog 스타일 에디터(좌 마크다운 / 우 미리보기)
- [ ] 출간/수정 시 확인 다이얼로그 표시
- [ ] 다이얼로그 필드: 썸네일(업로드 or URL)
- [ ] 다이얼로그 필드: 제목
- [ ] 다이얼로그 필드: 소개글
- [ ] 다이얼로그 필드: 공개 설정
- [ ] 다이얼로그 필드: 카테고리 지정
- [ ] 다이얼로그 `출간하기`로 최종 저장/전송
- [ ] 글 불러오기/저장 로딩 상태 명확화

## 6) 인증/인가
- [ ] `/admin/login -> /admin -> /admin/new` 안정 동작
- [ ] 이메일+비밀번호 로그인(Supabase Auth)
- [ ] `ADMIN_EMAIL_ALLOWLIST` 인가 적용
- [ ] 비인가 시 `/admin/login?error=forbidden`
- [ ] 세션 만료/로그아웃 처리 안정화

## 7) 데이터 모델(Supabase 직접 사용, Prisma 미사용)
- [ ] `posts` 테이블
- [ ] `categories` 테이블
- [ ] `tags` 테이블
- [ ] `post_tags` 조인 테이블
- [ ] `comments` 테이블(MVP)
- [ ] slug unique 규칙
- [ ] draft/published 상태 규칙

## 8) 서버 액션/기능 연결
- [ ] 글 작성 DB insert 연결
- [ ] 임시저장(draft) 연결
- [ ] 출간(published) 연결
- [ ] 글 수정 연결
- [ ] 글 조회(목록/상세) 연결
- [ ] 카테고리 CRUD 연결
- [ ] 댓글 작성/조회 연결

## 9) 라우트 로딩 컴포넌트
- [ ] 홈/피드 로딩
- [ ] 게시글 상세 로딩
- [ ] 관리자 대시보드 로딩
- [ ] 관리자 에디터 로딩

## 10) 배포/운영
- [ ] Vercel 환경변수 동기화
- [ ] 도메인(hellomook.com) 스모크 테스트
- [ ] 로그인/작성/조회 E2E 테스트
- [ ] 배포 체크리스트 문서화
- [ ] 오류/빈 상태/로딩 상태 최종 점검
- [ ] 접근성/성능 기본 점검

## 11) 완료 기준(DoD)
- [ ] 타입체크 통과 (`pnpm exec tsc --noEmit`)
- [ ] 린트 통과 (`pnpm lint`)
- [ ] published만 공개 노출
- [ ] 핵심 사용자 흐름(로그인→작성→출간→조회) 통과

## 12) 환경변수 체크
```bash
cp .env.example .env.local
```

필수:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `ADMIN_EMAIL_ALLOWLIST`

선택:
- [ ] `SUPABASE_SECRET_KEY`
- [ ] `ADMIN_GITHUB_ALLOWLIST` (현재 미사용)

## 13) 개발 커맨드
```bash
pnpm dev
pnpm lint
pnpm exec tsc --noEmit
```

