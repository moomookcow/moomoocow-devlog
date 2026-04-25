export default function HomeLoading() {
  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)_260px] lg:px-8">
      <aside className="space-y-4">
        <div className="surface-panel p-4">
          <div className="skeleton-block h-5 w-20" />
          <div className="mt-3 space-y-2">
            <div className="skeleton-block h-4 w-full" />
            <div className="skeleton-block h-4 w-4/5" />
            <div className="skeleton-block h-4 w-3/5" />
          </div>
        </div>
        <div className="surface-panel p-4">
          <div className="skeleton-block h-5 w-20" />
          <div className="mt-3 space-y-2">
            <div className="skeleton-block h-4 w-full" />
            <div className="skeleton-block h-4 w-4/5" />
          </div>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="surface-panel p-4">
          <div className="skeleton-block h-8 w-48" />
          <div className="mt-2 skeleton-block h-4 w-72" />
          <div className="mt-4 skeleton-block h-10 w-full" />
        </div>

        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="surface-panel p-4">
            <div className="flex items-center justify-between">
              <div className="skeleton-block h-6 w-20" />
              <div className="skeleton-block h-4 w-20" />
            </div>
            <div className="mt-3 skeleton-block h-7 w-4/5" />
            <div className="mt-3 space-y-2">
              <div className="skeleton-block h-4 w-full" />
              <div className="skeleton-block h-4 w-5/6" />
            </div>
          </div>
        ))}
      </section>

      <aside className="space-y-4">
        <div className="surface-panel p-4">
          <div className="skeleton-block h-5 w-20" />
          <div className="mt-3 space-y-2">
            <div className="skeleton-block h-4 w-full" />
            <div className="skeleton-block h-4 w-4/5" />
            <div className="skeleton-block h-4 w-3/5" />
          </div>
        </div>
        <div className="surface-panel p-4">
          <div className="skeleton-block h-5 w-20" />
          <div className="mt-3 space-y-2">
            <div className="skeleton-block h-4 w-full" />
            <div className="skeleton-block h-4 w-4/5" />
          </div>
        </div>
      </aside>
    </div>
  );
}

