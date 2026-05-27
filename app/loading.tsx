export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="surface-panel mb-4 px-5 py-8 sm:px-8 sm:py-10">
        <div className="skeleton-block h-12 w-64 sm:h-16 sm:w-96" />
        <div className="mt-3 skeleton-block h-7 w-72 sm:w-[32rem]" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="space-y-4">
          <div className="surface-panel p-4">
            <div className="skeleton-block h-6 w-24" />
            <div className="mt-3 space-y-2">
              <div className="skeleton-block h-4 w-full" />
              <div className="skeleton-block h-4 w-4/5" />
              <div className="skeleton-block h-4 w-3/5" />
            </div>
          </div>
        </aside>

        <section className="space-y-3">
          <div className="surface-panel p-3">
            <div className="flex flex-wrap gap-2">
              <div className="skeleton-block h-7 w-14" />
              <div className="skeleton-block h-7 w-20" />
              <div className="skeleton-block h-7 w-24" />
              <div className="skeleton-block h-7 w-18" />
            </div>
          </div>

          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="surface-panel p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="skeleton-block h-5 w-32" />
                <div className="skeleton-block h-4 w-20" />
              </div>
              <div className="mt-3 skeleton-block h-8 w-4/5" />
              <div className="mt-3 space-y-2">
                <div className="skeleton-block h-4 w-full" />
                <div className="skeleton-block h-4 w-5/6" />
              </div>
            </div>
          ))}
        </section>

        <aside className="space-y-4">
          <div className="surface-panel p-4">
            <div className="skeleton-block h-6 w-24" />
            <div className="mt-3 skeleton-block h-9 w-full" />
            <div className="mt-4 space-y-2">
              <div className="skeleton-block h-4 w-full" />
              <div className="skeleton-block h-4 w-4/5" />
              <div className="skeleton-block h-4 w-3/5" />
            </div>
          </div>
          <div className="surface-panel p-4">
            <div className="skeleton-block h-6 w-24" />
            <div className="mt-3 space-y-2">
              <div className="skeleton-block h-4 w-full" />
              <div className="skeleton-block h-4 w-4/5" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
