import { Card } from "@/components/ui";

/**
 * Loading placeholders.
 *
 * Every page is server-rendered on demand and does real work first, so without
 * these the browser sits on the previous screen with no sign that anything is
 * happening.
 */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <div className="h-7 w-12 shrink-0 animate-pulse rounded bg-raised" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-raised" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-raised" />
          {Array.from({ length: lines }).map((_, index) => (
            <div key={index} className="h-3 w-full animate-pulse rounded bg-raised" />
          ))}
        </div>
      </div>
    </Card>
  );
}

export function PageSkeleton({ title, cards = 3 }: { title: string; cards?: number }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-3 h-3 w-64 animate-pulse rounded bg-raised" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: cards }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}
