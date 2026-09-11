"use client";

import { Check, ChevronDown, CircleDot, MessageSquare, Search, X } from "lucide-react";
import { useState } from "react";

import { Chip, ScoreMeter } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/types";

/**
 * The hero demonstration: the same six issues, before and after.
 *
 * Off is a recreation of what a GitHub search actually hands back, down to the
 * label colours and the comment counts, because the pitch only lands if the
 * before is the real before. On is the product's own components, so the after
 * cannot drift from what people get. The switch is the whole argument.
 */

const RAW = [
  {
    title: "Add a dark mode toggle to the settings panel",
    repo: "acme/design-system",
    number: 1284,
    opened: "on 3 Feb 2024",
    author: "rmatthews",
    comments: 31,
    labels: ["good first issue", "help wanted"],
  },
  {
    title: "Make the right sidebar resizable, like the left one",
    repo: "openstreetmap/iD",
    number: 9822,
    opened: "3 months ago",
    author: "kbannister",
    comments: 4,
    labels: ["help wanted"],
  },
  {
    title: "Update the installation guide for the new CLI",
    repo: "acme/cli",
    number: 431,
    opened: "10 months ago",
    author: "dpaulson",
    comments: 6,
    labels: ["good first issue", "documentation"],
  },
  {
    title: "Fix toolbar icon alignment on Safari",
    repo: "acme/toolbar",
    number: 77,
    opened: "on 14 Mar 2017",
    author: "swhitfield",
    comments: 9,
    labels: ["good first issue", "bug"],
  },
  {
    title: "Improve error message when config is missing",
    repo: "acme/runtime",
    number: 2610,
    opened: "5 weeks ago",
    author: "jokonkwo",
    comments: 2,
    labels: ["good first issue"],
  },
  {
    title: "Add tests for the pagination helper",
    repo: "acme/utils",
    number: 188,
    opened: "7 months ago",
    author: "lferreira",
    comments: 1,
    labels: ["help wanted", "tests"],
  },
];

const SCORED: {
  title: string;
  repo: string;
  score: number;
  verdict: Verdict;
  note: string;
  tech: string[];
}[] = [
  {
    title: "Make the right sidebar resizable, like the left one",
    repo: "openstreetmap/iD",
    score: 79,
    verdict: "recommended",
    note: "Your stack, nobody assigned, maintainers active this week",
    tech: ["JavaScript", "3-10 hours"],
  },
  {
    title: "Improve error message when config is missing",
    repo: "acme/runtime",
    score: 71,
    verdict: "recommended",
    note: "Small and self-contained, and the issue says what finished looks like",
    tech: ["TypeScript", "1-3 hours"],
  },
  {
    title: "Add tests for the pagination helper",
    repo: "acme/utils",
    score: 58,
    verdict: "possible",
    note: "Good practice, but outside pull requests have not merged in 90 days",
    tech: ["TypeScript", "2-5 hours"],
  },
  {
    title: "Add a dark mode toggle to the settings panel",
    repo: "acme/design-system",
    score: 31,
    verdict: "not-recommended",
    note: "Someone called it in the comments eight months ago",
    tech: [],
  },
  {
    title: "Update the installation guide for the new CLI",
    repo: "acme/cli",
    score: 24,
    verdict: "not-recommended",
    note: "A linked pull request already merged. The issue was never closed",
    tech: [],
  },
  {
    title: "Fix toolbar icon alignment on Safari",
    repo: "acme/toolbar",
    score: 19,
    verdict: "not-recommended",
    note: "Open since 2017, no comment since 2019",
    tech: [],
  },
];

export function HeroDemo() {
  const [on, setOn] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        {on ? (
          <p className="text-sm font-medium">
            Your queue{" "}
            <span className="font-normal text-ink-faint">
              · {SCORED.length} scored against your profile
            </span>
          </p>
        ) : (
          <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-line bg-canvas px-2.5 py-1.5 font-mono text-[0.6875rem] break-all text-ink-soft">
            <Search size={12} strokeWidth={2} aria-hidden className="shrink-0 text-ink-faint" />
            is:issue is:open label:&quot;good first issue&quot;
          </span>
        )}

        <div
          role="group"
          aria-label="Compare searching GitHub with using Tracer"
          className="flex rounded-lg bg-raised p-0.5"
        >
          {[
            { value: false, label: "Without Tracer" },
            { value: true, label: "With Tracer" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setOn(option.value)}
              aria-pressed={on === option.value}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                on === option.value
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-ink-faint hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {on ? <ScoredList /> : <RawList />}

        {/* The list continues past the frame either way; the difference is
            whether continuing is a chore or unnecessary. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent"
        />
      </div>

      <p className="border-t border-line px-4 py-3 text-xs text-ink-faint">
        {on
          ? "Two worth taking, one worth a look, three to skip. Each with the reason."
          : "Six of 1,247,983, all the same shape. Which one is worth your Saturday?"}
      </p>
    </div>
  );
}

/**
 * GitHub's own label colours. A recreation that invents them stops being
 * recognisable, which is the only thing this list is for. Whole class strings
 * so Tailwind can see them.
 */
const LABEL_TONES: Record<string, string> = {
  "good first issue": "border-[#7057ff]/45 bg-[#7057ff]/12 text-[#5b32b0] dark:text-[#a371f7]",
  "help wanted": "border-[#008672]/45 bg-[#008672]/12 text-[#00695a] dark:text-[#2eb8a4]",
  documentation: "border-[#0075ca]/45 bg-[#0075ca]/12 text-[#005ea3] dark:text-[#4493f8]",
  bug: "border-[#d73a4a]/45 bg-[#d73a4a]/12 text-[#b32636] dark:text-[#f85149]",
};

function IssueLabel({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[0.6875rem] leading-4 font-medium whitespace-nowrap",
        LABEL_TONES[name] ?? "border-line bg-raised text-ink-faint",
      )}
    >
      {name}
    </span>
  );
}

function RawList() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-canvas px-4 py-2">
        <p className="text-xs text-ink-faint">
          <span className="font-medium text-ink-soft">1,247,983</span> results (412 ms)
        </p>
        <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-ink-soft">
          Sort by: Best match
          <ChevronDown size={12} strokeWidth={2} aria-hidden />
        </span>
      </div>

      <ul className="divide-y divide-line">
        {RAW.map((item) => (
          <li key={item.title} className="flex items-start gap-2.5 px-4 py-3">
            <CircleDot
              size={15}
              strokeWidth={2}
              aria-hidden
              className="mt-0.5 shrink-0 text-[#1a7f37] dark:text-[#3fb950]"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm leading-snug font-semibold text-[#0969da] dark:text-[#4493f8]">
                  {item.title}
                </span>
                {item.labels.map((label) => (
                  <IssueLabel key={label} name={label} />
                ))}
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                {item.repo} #{item.number} opened {item.opened} by {item.author}
              </p>
            </div>

            <span className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-ink-faint">
              <MessageSquare size={12} strokeWidth={2} aria-hidden />
              <span className="tabular-nums">{item.comments}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoredList() {
  // Counted from the rows themselves, so the strip cannot drift from the list.
  const filters = [
    { label: "All", count: SCORED.length, active: true },
    { label: "Take it", count: SCORED.filter((item) => item.verdict === "recommended").length },
    { label: "Worth a look", count: SCORED.filter((item) => item.verdict === "possible").length },
    { label: "Skip", count: SCORED.filter((item) => item.verdict === "not-recommended").length },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-canvas px-4 py-2">
        {filters.map((filter) => (
          <span
            key={filter.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[0.6875rem] font-medium",
              filter.active ? "bg-ink text-canvas" : "text-ink-faint",
            )}
          >
            {filter.label}
            <span className="font-mono tabular-nums opacity-70">{filter.count}</span>
          </span>
        ))}
      </div>

      <ul className="divide-y divide-line">
        {SCORED.map((item, index) => {
          const skip = item.verdict === "not-recommended";
          return (
            <li
              key={item.title}
              className={cn("flex items-start gap-3.5 px-4 py-3.5", skip && "bg-raised/45")}
            >
              <div className={cn("shrink-0", skip && "opacity-55")}>
                <ScoreMeter value={item.score} verdict={item.verdict} animate delayMs={index * 45} />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm leading-snug font-medium",
                    skip ? "text-ink-faint" : "text-ink",
                  )}
                >
                  {item.title}
                </p>
                <p className="mt-1 font-mono text-xs text-ink-faint">{item.repo}</p>

                <div className="mt-2 flex items-start gap-2">
                  {skip ? (
                    <X size={13} strokeWidth={2.5} aria-hidden className="mt-0.5 shrink-0 text-bad" />
                  ) : (
                    <Check
                      size={13}
                      strokeWidth={2.5}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-good"
                    />
                  )}
                  <p className="text-xs leading-relaxed text-ink-soft">{item.note}</p>
                </div>

                {item.tech.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.tech.map((tech) => (
                      <Chip key={tech}>{tech}</Chip>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
