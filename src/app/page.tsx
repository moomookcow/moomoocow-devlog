export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-8 px-6 py-16 sm:px-10 sm:py-20">
      <section className="rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
        <p className="font-display mb-3 text-base tracking-wide text-muted-foreground sm:text-lg">
          moomoocow-devlog
        </p>
        <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
          기술 개발 기록을 위한 블로그와 어드민을 단계적으로 구축합니다.
        </h1>
        <p className="font-display mt-3 text-xl leading-snug text-foreground/90 sm:text-2xl">
          We are building a technical devlog and admin workspace, step by step.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Next.js, Supabase, Prisma, shadcn/ui 기반으로 공개 블로그와 작성
          어드민을 함께 개발합니다. 현재는 Phase 0로, 프로젝트 기초 세팅과
          디자인 토큰 반영을 진행 중입니다.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Powered by Next.js, Supabase, Prisma, and a benchmark-informed design
          system inspired by Hermes.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity duration-[var(--motion-normal)] hover:opacity-90"
            href="/admin"
          >
            어드민 페이지(예정)
          </a>
          <a
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-border px-5 text-sm font-medium text-foreground transition-colors duration-[var(--motion-normal)] hover:bg-muted"
            href="https://hermes-agent.nousresearch.com/"
            target="_blank"
          >
            Hermes 벤치마크 보기
          </a>
        </div>
      </section>
    </main>
  );
}
