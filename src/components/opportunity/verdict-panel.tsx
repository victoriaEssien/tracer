import { Card, ReasonList, Score, VerdictBadge } from "@/components/ui";
import { formatHours, titleCase } from "@/lib/utils";
import type { Recommendation } from "@/types";

/**
 * The verdict, its one-line summary, and the explanation.
 *
 * This is the part of the product the user actually reads (spec section 12), so
 * it sits above everything else and never appears without its reasoning.
 */
export function VerdictPanel({ recommendation }: { recommendation: Recommendation }) {
  const { analysis } = recommendation;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Score value={recommendation.score} verdict={recommendation.verdict} size="lg" />
            <span className="text-xs text-ink-faint">Contribution fit</span>
          </div>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink">
            {recommendation.summary}
          </p>
        </div>
        <VerdictBadge verdict={recommendation.verdict} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 sm:grid-cols-4">
        <Fact label="Difficulty" value={titleCase(analysis.difficulty)} />
        <Fact label="Estimated time" value={formatHours(analysis.estimatedHours)} />
        <Fact label="Issue clarity" value={titleCase(analysis.clarity)} />
        <Fact label="Availability" value={availabilityLabel(analysis.status.availability)} />
      </dl>

      <div className="mt-5 grid gap-6 border-t border-line pt-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase">
            Why you might like this
          </h3>
          {recommendation.explanation.positives.length > 0 ? (
            <ReasonList items={recommendation.explanation.positives} tone="positive" />
          ) : (
            <p className="text-sm text-ink-faint">
              Nothing about this issue stands out as a good match.
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase">
            Things to know
          </h3>
          {recommendation.explanation.concerns.length > 0 ? (
            <ReasonList items={recommendation.explanation.concerns} tone="concern" />
          ) : (
            <p className="text-sm text-ink-faint">Nothing obvious to flag.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

function availabilityLabel(availability: string): string {
  const labels: Record<string, string> = {
    available: "Open, unclaimed",
    assigned: "Assigned",
    "likely-claimed": "Likely claimed",
    "has-pull-request": "Has a pull request",
    stale: "Inactive",
    closed: "Closed",
  };
  return labels[availability] ?? titleCase(availability);
}
