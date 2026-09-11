"use client";

import { useState } from "react";

import { Button, InferenceChip, Panel, StatusMessage } from "@/components/ui";
import { relativeTime } from "@/lib/utils";
import type { AiInsights } from "@/types";

/**
 * AI insights, kept visibly separate from observed data.
 *
 * Everything in this panel is inference: it is labelled as such, it is
 * generated on request rather than up front, and nothing here feeds the score
 * (spec section 16).
 */
export function AiPanel({
  issueId,
  initial,
  enabled,
}: {
  issueId: string;
  initial: AiInsights | null;
  enabled: boolean;
}) {
  const [insights, setInsights] = useState<AiInsights | null>(initial);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!enabled && !insights) return null;

  const generate = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/opportunities/${issueId}?ai=1`);
      const body = await response.json();
      const generated: AiInsights | null = body?.opportunity?.recommendation?.ai ?? null;
      if (generated) setInsights(generated);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel
      title="A reading of the issue"
      hint={
        <span className="flex items-center gap-2">
          {insights ? relativeTime(insights.generatedAt) : null}
          <InferenceChip />
        </span>
      }
    >

      {!insights ? (
        <div className="space-y-3">
          <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
            An optional AI pass can summarise the issue, sketch an approach, and list what to check
            before you start. It never touches the score.
          </p>
          <Button onClick={generate} disabled={loading}>
            {loading ? "Reading" : "Read it for me"}
          </Button>
          {failed ? (
            <StatusMessage tone="bad">
              The AI layer returned nothing usable. Everything above is unaffected.
            </StatusMessage>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {insights.summary ? (
            <p className="max-w-prose text-sm leading-relaxed text-ink-soft">{insights.summary}</p>
          ) : null}

          {insights.difficultyReasoning ? (
            <Block title="Why it looks this hard">
              <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
                {insights.difficultyReasoning}
              </p>
            </Block>
          ) : null}

          {insights.likelyFiles.length > 0 ? (
            <Block title="Files this might touch">
              <ul className="space-y-1">
                {insights.likelyFiles.map((file) => (
                  <li key={file} className="font-mono text-xs text-ink-soft">
                    {file}
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}

          {insights.contributionPlan.length > 0 ? (
            <Block title="One way to approach it">
              <ol className="space-y-1.5">
                {insights.contributionPlan.map((step, index) => (
                  <li key={step} className="flex gap-2.5 text-sm text-ink-soft">
                    <span className="font-mono text-xs text-ink-faint tabular-nums">
                      {index + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Block>
          ) : null}

          {insights.questionsToInvestigate.length > 0 ? (
            <Block title="Worth checking first">
              <ul className="space-y-1.5">
                {insights.questionsToInvestigate.map((question) => (
                  <li key={question} className="flex gap-2.5 text-sm text-ink-soft">
                    <span aria-hidden className="text-ink-faint">
                      &bull;
                    </span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}

          <p className="border-t border-line pt-3 text-xs text-ink-faint">
            Written by {insights.provider}/{insights.model} from the issue text alone. Check it
            against the repository before you rely on it.
          </p>
        </div>
      )}
    </Panel>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium text-ink-faint">{title}</h3>
      {children}
    </div>
  );
}
