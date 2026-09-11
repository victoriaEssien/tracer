import { Card, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20">
      <Card className="p-6">
        <h1 className="text-lg font-semibold">Not found</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
          This page does not exist. An opportunity can also end up here if it was removed from your
          feed, or if the analysis behind it was cleared.
        </p>
        <div className="mt-4">
          <LinkButton href="/feed" variant="primary">
            Back to the feed
          </LinkButton>
        </div>
      </Card>
    </main>
  );
}
