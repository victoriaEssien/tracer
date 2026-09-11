import { Card, ConfidenceNote, ReasonList, SectionHeading, SignalBar } from "@/components/ui";
import type { ScoreBreakdownEntry } from "@/types";

/**
 * Where the score came from, dimension by dimension.
 *
 * Published methodology is one of the project's stated priorities (spec section
 * 23), and a score nobody can take apart is not one worth trusting — so every
 * weight, sub-score and reason is on screen rather than in a tooltip.
 */
export function ScoreBreakdown({
  breakdown,
  alreadyShown = [],
}: {
  breakdown: ScoreBreakdownEntry[];
  /**
   * Reasoning the explanation panel above has already given. Repeating it here
   * makes the page read as if it is padding, and buries the lines that are
   * only visible in the breakdown.
   */
  alreadyShown?: string[];
}) {
  const shown = new Set(alreadyShown);
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

            {(() => {
              const reasons = entry.reasons.filter((item) => !shown.has(item));
              const concerns = entry.concerns.filter((item) => !shown.has(item));
              if (reasons.length === 0 && concerns.length === 0) return null;
              return (
                <div className="mt-2.5 space-y-1.5">
                  <ReasonList items={reasons} tone="positive" />
                  <ReasonList items={concerns} tone="concern" />
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </Card>
  );
}
