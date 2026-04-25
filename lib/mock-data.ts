import type { CategoryGroup } from "@/components/shared/category-panel";

export const sharedCategoryGroups: CategoryGroup[] = [
  {
    name: "Frontend",
    children: [
      {
        name: "Next.js",
        posts: [
          "App Router에서 인증 가드 구성",
          "loading.tsx와 전환 UX",
          "SSR/CSR 경계 설계 메모",
        ],
      },
      {
        name: "React",
        posts: [
          "상태 분리와 리렌더링 최소화",
          "폼 이벤트 처리 트러블슈팅",
          "컴포넌트 구조 리팩터링 노트",
        ],
      },
      {
        name: "Tailwind",
        posts: [
          "토큰 기반 유틸 클래스 전략",
          "hover/focus 스타일 통일",
          "반응형 breakpoints 정리",
        ],
      },
      {
        name: "shadcn/ui",
        posts: [
          "Accordion 커스터마이징",
          "Card/Badge 톤 매칭",
          "ScrollArea 적용 패턴",
        ],
      },
    ],
  },
  {
    name: "Backend",
    children: [
      {
        name: "Supabase",
        posts: [
          "Auth 리다이렉트 꼬임 해결",
          "쿠키 세션 디버깅",
          "운영 환경 설정 체크리스트",
        ],
      },
      {
        name: "Auth",
        posts: [
          "관리자 접근 제어 규칙",
          "로그인 오류 케이스 정리",
          "허용 계정 정책 초안",
        ],
      },
      {
        name: "DB Schema",
        posts: [
          "포스트/카테고리 모델 초안",
          "슬러그 정책 정리",
          "태그 구조 설계 노트",
        ],
      },
      {
        name: "Server Actions",
        posts: ["폼 제출 흐름 정리", "유효성 검사 전략", "에러 메시지 UX 기준"],
      },
    ],
  },
  {
    name: "Workflow",
    children: [
      {
        name: "Design System",
        posts: [
          "Hermes 벤치마크 규칙화",
          "폰트/타이포 토큰 정의",
          "컴포넌트 품질 게이트 정리",
        ],
      },
      {
        name: "Deployment",
        posts: [
          "Vercel 환경변수 체크",
          "도메인 연결 절차",
          "배포 후 검증 루틴",
        ],
      },
      {
        name: "Testing",
        posts: ["타입체크 루틴", "UI 수동 QA 체크리스트", "회귀 테스트 포인트"],
      },
    ],
  },
];
