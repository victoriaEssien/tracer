import { Card, ConfidenceNote, ReasonList, SectionHeading, SignalBar } from "@/components/ui";
import type { ScoreBreakdownEntry } from "@/types";

/**
 * Where the score came from, dimension by dimension.
 *
 * Published methodology is one of the project's stated priorities (spec section
 * 23), and a score nobody can take apart is not one worth trusting — so every
 * weight, sub-score and reason is on screen rather than in a tooltip.
 */
export function ScoreBreakdown({ breakdown }: { breakdown: ScoreBreakdownEntry[] }) {
  return (
    <Card className="p-5">
      <SectionHeading hint="weights are published in docs/scoring.md">
        How this was scored
      </SectionHeading>

      <div className="divide-y divide-line">
        {breakdown.map((entry) => (
          <div key={entry.dimension} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{entry.label}</span>
                <ConfidenceNote confidence={entry.confidence} />
              </div>
              <div className="flex items-baseline gap-2 text-xs text-ink-faint tabular-nums">
                <span>{Math.round(entry.raw * 100)}%</span>
                <span>×</span>
                <span>{Math.round(entry.weight * 100)}% weight</span>
                <span className="w-12 text-right font-medium text-ink-soft">
                  +{entry.contribution.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="mt-2">
              <SignalBar value={entry.raw} />
            </div>

            {entry.reasons.length > 0 || entry.concerns.length > 0 ? (
              <div className="mt-2.5 space-y-1.5">
                <ReasonList items={entry.reasons} tone="positive" />
                <ReasonList items={entry.concerns} tone="concern" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
