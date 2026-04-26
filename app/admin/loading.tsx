export default function AdminLoading() {
  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="surface-panel mb-4 px-5 py-8 sm:px-8 sm:py-10">
        <div className="skeleton-block h-12 w-72 sm:h-16 sm:w-[32rem]" />
        <div className="mt-3 skeleton-block h-6 w-80 sm:w-[40rem]" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="space-y-4">
          <div className="surface-panel rounded-none p-4">
            <div className="skeleton-block h-6 w-24" />
            <div className="mt-3 space-y-2">
              <div className="skeleton-block h-4 w-full" />
              <div className="skeleton-block h-4 w-5/6" />
              <div className="skeleton-block h-4 w-2/3" />
              <div className="skeleton-block h-4 w-4/5" />
            </div>
          </div>
        </aside>

        <section className="space-y-3">
          <div className="surface-panel rounded-none p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="skeleton-block h-5 w-36" />
                <div className="skeleton-block h-10 w-56" />
                <div className="skeleton-block h-5 w-72" />
              </div>
              <div className="flex gap-2">
                <div className="skeleton-block h-9 w-28" />
                <div className="skeleton-block h-9 w-24" />
                <div className="skeleton-block h-9 w-20" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="surface-subtle rounded-none p-3">
                <div className="skeleton-block h-4 w-20" />
                <div className="mt-2 skeleton-block h-8 w-14" />
              </div>
              <div className="surface-subtle rounded-none p-3">
                <div className="skeleton-block h-4 w-20" />
                <div className="mt-2 skeleton-block h-8 w-14" />
              </div>
              <div className="surface-subtle rounded-none p-3">
                <div className="skeleton-block h-4 w-20" />
                <div className="mt-2 skeleton-block h-8 w-14" />
              </div>
            </div>
          </div>

          <div className="surface-panel rounded-none p-5">
            <div className="skeleton-block h-8 w-40" />
            <div className="mt-3 space-y-2">
              <div className="surface-subtle rounded-none p-3">
                <div className="skeleton-block h-6 w-3/4" />
                <div className="mt-2 skeleton-block h-4 w-full" />
              </div>
              <div className="surface-subtle rounded-none p-3">
                <div className="skeleton-block h-6 w-4/5" />
                <div className="mt-2 skeleton-block h-4 w-11/12" />
              </div>
              <div className="surface-subtle rounded-none p-3">
                <div className="skeleton-block h-6 w-2/3" />
                <div className="mt-2 skeleton-block h-4 w-10/12" />
              </div>
            </div>
          </div>
        </section>

        <aside className="surface-panel rounded-none p-4">
          <div className="skeleton-block h-6 w-28" />
          <div className="mt-4 space-y-2">
            <div className="skeleton-block h-4 w-full" />
            <div className="skeleton-block h-4 w-5/6" />
            <div className="skeleton-block h-4 w-4/5" />
            <div className="skeleton-block h-4 w-full" />
            <div className="skeleton-block h-4 w-3/4" />
            <div className="skeleton-block h-4 w-2/3" />
          </div>
        </aside>
      </div>
    </main>
  );
}
