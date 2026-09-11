import { Bar, ConfidenceNote, EvidenceList, Panel } from "@/components/ui";
import type { ScoreBreakdownEntry } from "@/types";

/**
 * Where the score came from, dimension by dimension.
 *
 * Publishing the method is a stated priority (spec section 23), and a score
 * nobody can take apart is not one worth trusting. Every weight, sub-score and
 * reason is on the page rather than behind a tooltip.
 */
export function ScoreBreakdown({
  breakdown,
  alreadyShown = [],
}: {
  breakdown: ScoreBreakdownEntry[];
  /**
   * Reasoning the panel above has already given. Repeating it reads as padding
   * and buries the lines that only appear here.
   */
  alreadyShown?: string[];
}) {
  const shown = new Set(alreadyShown);

  return (
    <Panel title="How the score was built" hint="weights published in docs/scoring.md">
      <div className="divide-y divide-line">
        {breakdown.map((entry) => {
          const reasons = entry.reasons.filter((item) => !shown.has(item));
          const concerns = entry.concerns.filter((item) => !shown.has(item));

          return (
            <div key={entry.dimension} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{entry.label}</span>
                  <ConfidenceNote confidence={entry.confidence} />
                </div>
                <div className="flex shrink-0 items-baseline gap-2 font-mono text-xs text-ink-faint tabular-nums">
                  <span>{Math.round(entry.raw * 100)}</span>
                  <span aria-hidden>x</span>
                  <span>{Math.round(entry.weight * 100)}%</span>
                  <span className="w-10 text-right font-medium text-ink-soft">
                    {entry.contribution.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="mt-2">
                <Bar value={entry.raw} />
              </div>

              {reasons.length > 0 || concerns.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <EvidenceList items={reasons} tone="positive" />
                  <EvidenceList items={concerns} tone="caution" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
