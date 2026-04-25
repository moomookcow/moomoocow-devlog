import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const nestedCategories = [
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

const mockPopular = [
  "Next.js App Router에서 인증 흐름 정리",
  "Supabase Auth 실전 트러블슈팅",
  "Velog 스타일 에디터 구현 메모",
  "React Server Components 경계 설계",
  "SSR/CSR 혼합 렌더링에서의 상태 관리",
  "다크모드 토글 UX 체크리스트",
  "Markdown 렌더링 성능 최적화 포인트",
  "TOC active 섹션 추적 구현기",
  "Route-level loading.tsx 패턴 정리",
  "shadcn/ui 컴포넌트 확장 전략",
  "Tailwind 토큰과 시맨틱 클래스 정리",
  "Supabase Row Level Security 기초",
  "로그인 리다이렉트 꼬임 디버깅",
  "관리자 페이지 접근 제어 설계",
  "포스트 slug 중복 처리 방식 비교",
  "카테고리 트리 UI 패턴 사례",
  "댓글 시스템 MVP 범위 정의",
  "피드 패널 스크롤 UX 개선안",
  "포럼형 카드 레이아웃 실험",
  "Noto Sans KR vs Display Font 조합",
  "Vercel 배포 체크리스트 템플릿",
];
const mockRecent = [
  "디자인 토큰을 먼저 고정해야 하는 이유",
  "관리자 대시보드 1차 구조",
  "다크모드 토글 적용 기록",
  "루트 페이지 히어로 재배치",
  "카테고리 접기/펼치기 구조 도입",
  "피드 패널 검색 입력 고정",
  "포스트 카드 뱃지 스타일 조정",
  "헤더/푸터 높이 확장 테스트",
  "Song Myung 적용 범위 확장",
  "공용 로딩 컴포넌트 초안",
  "관리자 로그인 경로 히든 진입",
  "Switch 기반 테마 토글 교체",
  "페이지별 스크롤 책임 분리",
  "모바일 레이아웃 1차 점검",
  "README TODO 보드화",
  "DESIGN_SYSTEM 규칙 강화",
  "보더/라운드 절제 규칙 추가",
  "shadcn 강제 사용 원칙 문서화",
  "환경변수 템플릿(.env.example) 추가",
  "초기 부트스트랩 재정비 완료",
];
const mockComments = [
  "로그인 흐름 정리 감사합니다",
  "TOC UI 기대돼요",
  "다음 글도 기다릴게요",
  "카테고리 트리 구조 마음에 듭니다",
  "피드 패널 스크롤 UX 좋아요",
  "히어로 타이틀이 강렬하네요",
  "관리자 진입 방식 재밌습니다",
  "다크모드 토글 위치가 좋네요",
  "검색 입력 고정 너무 편해요",
  "카드 설명 폰트 실험 흥미롭네요",
  "다음엔 댓글 기능 빨리 부탁해요",
  "모바일에서도 잘 보이네요",
  "디자인 시스템 문서가 탄탄합니다",
  "라운드 줄인 톤이 더 잘 맞아요",
  "포럼 느낌이 확 살아났어요",
  "최근 글 리스트 가독성 좋아요",
  "인기 글 순위 표시 유용합니다",
  "Route loading 적용 기대돼요",
  "관리자 대시보드도 같은 톤이면 좋겠어요",
  "연재형 카테고리도 지원되면 좋겠습니다",
];
const mockPosts = [
  {
    slug: "nextjs-auth-flow",
    title: "Next.js에서 관리자 인증 흐름 안정화하기",
    summary:
      "리다이렉트 꼬임 없이 /admin 과 /admin/new 를 안정적으로 연결한 과정을 기록합니다.",
    category: "Next.js",
    date: "2026-04-25",
  },
  {
    slug: "supabase-without-prisma",
    title: "Prisma 없이 Supabase 직접 연결로 가는 이유",
    summary: "ORM 없이 직접 접근을 선택한 배경과 장단점을 정리합니다.",
    category: "Supabase",
    date: "2026-04-24",
  },
  {
    slug: "design-system-todo",
    title: "기획을 TODO로 전환해서 속도 내기",
    summary:
      "문서 기반 진행표를 만들고 체크하며 개발하는 방식에 대한 노트입니다.",
    category: "Design System",
    date: "2026-04-23",
  },
];

function FeedPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-2">
      <h3 className="korean-display text-xl">{title}</h3>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li
            key={item}
            className="theme-hover-soft flex cursor-pointer items-start gap-2 rounded-[2px] px-1 py-0.5 text-sm"
          >
            <span className="font-mono text-muted-foreground">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="korean-display line-clamp-2">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="surface-panel mb-4 px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="korean-display text-balance text-5xl leading-[0.95] sm:text-7xl">
          MooMooCow Devlog
        </h1>
        <p className="korean-display mt-3 text-xl text-foreground/90 sm:text-2xl">
          실전 개발 과정과 트러블슈팅을 기록하는 개인 개발 로그
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="self-start space-y-4">
          <Card className="surface-panel rounded-none flex max-h-[72vh] flex-col overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="korean-display text-2xl">
                카테고리
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <ScrollArea className="max-h-[calc(72vh-6.5rem)] pr-2">
                <Accordion multiple className="w-full">
                  {nestedCategories.map((group) => (
                    <AccordionItem
                      key={group.name}
                      value={group.name}
                      className="border-border/60"
                    >
                      <AccordionTrigger className="korean-display cursor-pointer text-base">
                        {group.name}
                      </AccordionTrigger>
                      <AccordionContent>
                        <Accordion multiple className="w-full">
                          {group.children.map((child) => (
                            <AccordionItem
                              key={`${group.name}-${child.name}`}
                              value={`${group.name}-${child.name}`}
                              className="border-border/40"
                            >
                              <AccordionTrigger className="korean-display cursor-pointer pl-4 text-sm text-muted-foreground">
                                {child.name}
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-1 pl-8">
                                  {child.posts.map((postTitle) => (
                                    <li
                                      key={postTitle}
                                      className="theme-hover-soft korean-display cursor-pointer rounded-[2px] px-1 py-0.5 text-sm"
                                    >
                                      {postTitle}
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-3">
          {mockPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="group/card block"
            >
              <Card className="theme-hover-soft surface-panel rounded-none cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="korean-display rounded-sm px-2 py-2 text-sm"
                    >
                      {post.category}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {post.date}
                    </span>
                  </div>
                  <CardTitle className="korean-display text-2xl transition-opacity duration-150 group-hover/card:opacity-80">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-sm text-muted-foreground">
                    {post.summary}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <aside className="lg:sticky lg:top-24">
          <Card className="surface-panel rounded-none flex h-[72vh] min-h-[520px] flex-col overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="korean-display text-2xl">
                피드 패널
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="shrink-0">
                <Input
                  placeholder="검색"
                  aria-label="게시글 검색"
                  className="h-9 font-mono text-sm"
                />
              </div>
              <ScrollArea className="min-h-0 flex-1 pr-2">
                <div className="space-y-6">
                  <FeedPanel title="인기 글" items={mockPopular} />
                  <FeedPanel title="최근 글" items={mockRecent} />
                  <FeedPanel title="최근 댓글" items={mockComments} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
