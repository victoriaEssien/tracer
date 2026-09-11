import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h1 className="font-display text-3xl tracking-tight">Nothing here</h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
        This page does not exist. An opportunity can also land here if it dropped out of your queue
        or its analysis was cleared.
      </p>
      <div className="mt-6">
        <LinkButton href="/feed" variant="primary">
          Back to your queue
        </LinkButton>
      </div>
    </main>
  );
}
