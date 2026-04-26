export default function AdminEditorLoading() {
  return (
    <main className="fixed inset-0 z-[60] flex min-h-0 flex-col overflow-hidden bg-background px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-3 shrink-0">
        <div className="skeleton-block h-9 w-72" />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="surface-panel grid h-full min-h-0 grid-cols-1 rounded-none lg:grid-cols-2">
          <section className="min-h-0 border-b border-border/60 p-4 lg:border-b-0 lg:border-r">
            <div className="space-y-3">
              <div className="skeleton-block h-14 w-full" />
              <div className="skeleton-block h-10 w-full" />
            </div>
            <div className="mt-4 h-[calc(100%-7rem)] space-y-2 overflow-hidden">
              <div className="skeleton-block h-6 w-2/3" />
              <div className="skeleton-block h-5 w-11/12" />
              <div className="skeleton-block h-5 w-full" />
              <div className="skeleton-block h-5 w-10/12" />
              <div className="skeleton-block h-5 w-full" />
              <div className="skeleton-block h-5 w-5/6" />
              <div className="skeleton-block h-5 w-4/5" />
            </div>
          </section>

          <section className="min-h-0 p-4">
            <div className="h-full space-y-2 overflow-hidden">
              <div className="skeleton-block h-7 w-2/3" />
              <div className="skeleton-block h-5 w-full" />
              <div className="skeleton-block h-5 w-11/12" />
              <div className="skeleton-block h-5 w-full" />
              <div className="skeleton-block h-5 w-10/12" />
              <div className="skeleton-block h-5 w-4/5" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
