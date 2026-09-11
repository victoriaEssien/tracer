/**
 * Loading placeholders.
 *
 * Every page is server-rendered on demand and does real work first, so without
 * these the browser sits on the previous screen with no sign of progress.
 */
function RowSkeleton() {
  return (
    <div className="border-b border-line px-3 py-4 sm:px-4">
      <div className="flex gap-4">
        <div className="w-14 shrink-0 space-y-1.5">
          <div className="h-5 w-10 animate-pulse rounded bg-raised" />
          <div className="h-1 w-full animate-pulse rounded-full bg-raised" />
        </div>
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-2/3 animate-pulse rounded bg-raised" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-raised" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-raised" />
        </div>
      </div>
    </div>
  );
}

export function QueueSkeleton({ title, rows = 4 }: { title: string; rows?: number }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-2.5 h-3 w-64 animate-pulse rounded bg-raised" />
      </div>
      <div className="-mx-3 sm:-mx-4">
        {Array.from({ length: rows }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}
