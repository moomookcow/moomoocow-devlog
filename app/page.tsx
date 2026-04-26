import NextImage from "next/image";
import Link from "next/link";

import CategoryPanel from "@/components/shared/category-panel";
import RightFeedPanel from "@/components/shared/right-feed-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCategoryPanelGroups } from "@/lib/category-panel-data";
import { listActiveCategories } from "@/lib/categories";
import { sharedCategoryGroups } from "@/lib/mock-data";
import { listPublishedPosts } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

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

const homeFeedSections = [
  {
    title: "인기 글",
    items: mockPopular.map((label, idx) => ({ id: `popular-${idx}`, label })),
  },
  {
    title: "최근 글",
    items: mockRecent.map((label, idx) => ({ id: `recent-${idx}`, label })),
  },
  {
    title: "최근 댓글",
    items: mockComments.map((label, idx) => ({ id: `comment-${idx}`, label })),
  },
];

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function HomePage() {
  const supabase = await createClient();
  let publishedPosts = [] as Awaited<ReturnType<typeof listPublishedPosts>>;
  let categoryGroups = sharedCategoryGroups;

  try {
    publishedPosts = await listPublishedPosts(supabase, 50);
  } catch {
    publishedPosts = [];
  }
  try {
    const categories = await listActiveCategories(supabase, 200);
    const groups = buildCategoryPanelGroups(categories, publishedPosts, { hrefBase: "/posts" });
    if (groups.length > 0) {
      categoryGroups = groups;
    }
  } catch {
    categoryGroups = sharedCategoryGroups;
  }

  const visiblePosts =
    publishedPosts.length > 0
      ? publishedPosts.map((post) => ({
          slug: post.slug,
          title: post.title,
          summary: post.summary ?? "",
          category: post.category ?? "Uncategorized",
          date: formatDate(post.publishedAt || post.updatedAt),
          thumbnailUrl: post.thumbnailUrl,
        }))
      : mockPosts.map((post) => ({ ...post, thumbnailUrl: null as string | null }));

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
          <CategoryPanel groups={categoryGroups} />
        </aside>

        <section className="space-y-3">
          {visiblePosts.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="group/card block"
            >
              <Card className="theme-hover-soft surface-panel rounded-none cursor-pointer">
                {post.thumbnailUrl ? (
                  <div className="border-b border-border/60">
                    <NextImage
                      src={post.thumbnailUrl}
                      alt={`${post.title} thumbnail`}
                      width={1200}
                      height={630}
                      sizes="(max-width: 1024px) 100vw, 860px"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                ) : null}
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
          <RightFeedPanel panelTitle="피드 패널" searchPlaceholder="검색" searchAriaLabel="게시글 검색" sections={homeFeedSections} />
        </aside>
      </div>
    </div>
  );
}
