export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="h-3 w-14 animate-pulse rounded bg-raised" />
      <div className="mt-5 space-y-3">
        <div className="h-8 w-4/5 animate-pulse rounded bg-raised" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-raised" />
      </div>
      <div className="mt-8 flex gap-6">
        <div className="h-12 w-28 animate-pulse rounded bg-raised" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 animate-pulse rounded bg-raised" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-raised" />
        </div>
      </div>
    </main>
  );
}
