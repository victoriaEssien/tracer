import { CardSkeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="h-3 w-16 animate-pulse rounded bg-raised" />
      <div className="mt-4 mb-6 space-y-2">
        <div className="h-6 w-3/4 animate-pulse rounded bg-raised" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-raised" />
      </div>
      <div className="space-y-4">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={4} />
      </div>
    </main>
  );
}
