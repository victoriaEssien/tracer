import { EvidenceList, ScoreMeter, VERDICT_COPY } from "@/components/ui";
import { formatHours } from "@/lib/utils";
import type { IssueAvailability, Recommendation } from "@/types";

const AVAILABILITY_LABEL: Record<IssueAvailability, string> = {
  available: "Open, unclaimed",
  assigned: "Assigned",
  "likely-claimed": "Someone has called it",
  "has-pull-request": "A PR already exists",
  stale: "Long inactive",
  closed: "Closed",
};

const CLARITY_LABEL = { high: "Clear", medium: "Workable", low: "Thin" } as const;

/**
 * The verdict and why.
 *
 * The top of the dossier and the thing people actually read (spec section 12),
 * so the sentence comes before the evidence and the evidence before the maths.
 */
export function VerdictPanel({ recommendation }: { recommendation: Recommendation }) {
  const { analysis } = recommendation;

  return (
    <section>
      <div className="flex flex-wrap items-start gap-6">
        <ScoreMeter
          value={recommendation.score}
          verdict={recommendation.verdict}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xl leading-snug font-semibold tracking-tight text-balance">
            {VERDICT_COPY[recommendation.verdict].label}.
          </p>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-soft">
            {recommendation.summary}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
        <Fact label="Difficulty" value={capitalise(analysis.difficulty)} />
        <Fact label="Time" value={formatHours(analysis.estimatedHours)} />
        <Fact label="The issue" value={CLARITY_LABEL[analysis.clarity]} />
        <Fact label="Status" value={AVAILABILITY_LABEL[analysis.status.availability]} />
      </dl>

      <div className="mt-6 grid gap-7 border-t border-line pt-5 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">In its favour</h2>
          {recommendation.explanation.positives.length > 0 ? (
            <EvidenceList items={recommendation.explanation.positives} tone="positive" />
          ) : (
            <p className="text-sm text-ink-faint">
              Nothing here stands out as a good match for you.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Before you start</h2>
          {recommendation.explanation.concerns.length > 0 ? (
            <EvidenceList items={recommendation.explanation.concerns} tone="caution" />
          ) : (
            <p className="text-sm text-ink-faint">Nothing obvious to flag.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
