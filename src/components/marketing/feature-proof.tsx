import { AlertTriangle, Check } from "lucide-react";

import { Chip } from "@/components/ui";

/**
 * Small fragments of the real interface, used beside each claim on the landing
 * page. They are built from the product's own components and tokens rather than
 * drawn as pictures, so a change to the UI cannot leave the marketing page
 * describing something that no longer exists.
 */

/** A comment thread, and the conclusion Tracer draws from it. */
export function ClaimedProof() {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <p className="text-xs text-ink-faint">Comment 7 of 31</p>
      <div className="mt-3 space-y-3">
        <div className="flex gap-2.5">
          <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-raised" aria-hidden />
          <div>
            <p className="font-mono text-xs text-ink-faint">@contributor</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              I&apos;d like to work on this one, assigning myself
            </p>
          </div>
        </div>
        <p className="font-mono text-xs text-ink-faint">8 months ago. Never assigned.</p>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
        <AlertTriangle size={14} strokeWidth={2} aria-hidden className="shrink-0 text-warn" />
        <p className="text-sm font-medium text-warn">Someone called it</p>
        <Chip tone="bad" className="ml-auto">
          Skip it
        </Chip>
      </div>
    </div>
  );
}

/** The health numbers that decide whether a pull request goes anywhere. */
export function ThroughputProof() {
  const rows = [
    { label: "Merged from outsiders, 90 days", value: "28", good: true },
    { label: "First reply to a pull request", value: "14h", good: true },
    { label: "Open longer than 90 days", value: "2", good: true },
    { label: "Last commit", value: "today", good: true },
  ];

  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <dl className="divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-sm text-ink-soft">{row.label}</dt>
            <dd className="font-mono text-sm font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <Check size={14} strokeWidth={2.5} aria-hidden className="shrink-0 text-good" />
        <p className="text-sm font-medium text-good">Work lands here</p>
      </div>
    </div>
  );
}

/** The arithmetic, on screen, the way the deep dive shows it. */
export function BreakdownProof() {
  const rows = [
    { label: "Your stack", raw: 0.81, weight: 0.25 },
    { label: "Actually free", raw: 0.95, weight: 0.2 },
    { label: "Project health", raw: 0.72, weight: 0.15 },
    { label: "Issue clarity", raw: 0.44, weight: 0.15 },
  ];

  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink-soft">{row.label}</span>
              <span className="font-mono text-xs text-ink-faint tabular-nums">
                {Math.round(row.raw * 100)} × {Math.round(row.weight * 100)}% ={" "}
                <span className="font-medium text-ink-soft">
                  {(row.raw * row.weight * 100).toFixed(1)}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full rounded-full bg-ink-faint"
                style={{ width: `${row.raw * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-line pt-3 font-mono text-xs text-ink-faint">
        + four more signals = <span className="font-medium text-ink">79%</span>
      </p>
    </div>
  );
}
