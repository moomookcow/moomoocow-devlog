export default function PublicPostDetailLoading() {
  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="surface-panel h-80 animate-pulse rounded-none" />
        <div className="space-y-3">
          <div className="surface-panel h-52 animate-pulse rounded-none" />
          <div className="surface-panel h-[40rem] animate-pulse rounded-none" />
          <div className="surface-panel h-40 animate-pulse rounded-none" />
        </div>
        <div className="surface-panel h-80 animate-pulse rounded-none" />
      </div>
    </main>
  );
}
