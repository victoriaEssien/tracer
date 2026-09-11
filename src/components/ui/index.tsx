/**
 * UI primitives.
 *
 * Small enough to live in one file, and kept there on purpose: a component
 * library is not what this project is for.
 */

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { Confidence, Difficulty, Verdict } from "@/types";

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "active";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-ink text-canvas hover:opacity-90",
  secondary: "border border-line bg-surface text-ink hover:bg-raised",
  ghost: "text-ink-soft hover:bg-raised hover:text-ink",
  danger: "border border-line text-bad hover:bg-bad-soft",
  /** An on state, for toggles where the label alone reads as a noun. */
  active: "border border-accent bg-accent-soft text-accent",
};

export function Button({
  variant = "secondary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "secondary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition",
        BUTTON_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                   */
/* -------------------------------------------------------------------------- */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-lg border border-line bg-surface", className)}
      {...props}
    />
  );
}

export function SectionHeading({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase">
        {children}
      </h2>
      {hint ? <span className="text-xs text-ink-faint">{hint}</span> : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {children ? <p className="max-w-md text-sm text-ink-soft">{children}</p> : null}
      {action}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: "neutral" | "good" | "warn" | "bad" | "accent" }) {
  const tones = {
    neutral: "border-line bg-raised text-ink-soft",
    good: "border-transparent bg-good-soft text-good",
    warn: "border-transparent bg-warn-soft text-warn",
    bad: "border-transparent bg-bad-soft text-bad",
    accent: "border-transparent bg-accent-soft text-accent",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export const VERDICT_COPY: Record<Verdict, { label: string; tone: "good" | "warn" | "bad" }> = {
  recommended: { label: "Recommended", tone: "good" },
  possible: { label: "Possible", tone: "warn" },
  "not-recommended": { label: "Not recommended", tone: "bad" },
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { label, tone } = VERDICT_COPY[verdict];
  return <Badge tone={tone}>{label}</Badge>;
}

const DIFFICULTY_TONE: Record<Difficulty, "good" | "warn" | "bad" | "neutral"> = {
  easy: "good",
  medium: "warn",
  hard: "bad",
  unclear: "neutral",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge tone={DIFFICULTY_TONE[difficulty]} className="capitalize">
      {difficulty}
    </Badge>
  );
}

/**
 * Marks how much the data supports a claim. Shown wherever a signal is weak,
 * because a confident-looking number built on two data points is the one thing
 * this product must not do.
 */
export function ConfidenceNote({ confidence }: { confidence: Confidence }) {
  if (confidence === "high") return null;
  return (
    <span className="text-xs text-ink-faint">
      {confidence === "low" ? "limited data" : "partial data"}
    </span>
  );
}

/** Distinguishes AI inference from observed GitHub data (spec section 16). */
export function InferenceBadge() {
  return (
    <Badge tone="accent" className="font-mono text-[0.65rem] tracking-wide uppercase">
      Inferred
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Score                                                                      */
/* -------------------------------------------------------------------------- */

export function Score({
  value,
  verdict,
  size = "md",
}: {
  value: number;
  verdict: Verdict;
  size?: "sm" | "md" | "lg";
}) {
  const tone = VERDICT_COPY[verdict].tone;
  const colors = {
    good: "text-good",
    warn: "text-warn",
    bad: "text-bad",
  } as const;

  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  } as const;

  return (
    <div className="flex items-baseline gap-0.5 whitespace-nowrap">
      <span className={cn("font-semibold tabular-nums", sizes[size], colors[tone])}>{value}</span>
      <span className={cn("text-xs font-medium", colors[tone])}>%</span>
    </div>
  );
}

/** A horizontal bar for one scoring dimension. */
export function SignalBar({ value, tone = "ink" }: { value: number; tone?: "ink" | "accent" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-raised">
      <div
        className={cn("h-full rounded-full", tone === "accent" ? "bg-accent" : "bg-ink-soft")}
        style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reason lists                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A polite live region. Progress and error text is useless to a screen reader
 * if it only appears visually, and every status message in this app is
 * transient.
 */
export function StatusMessage({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "bad";
  className?: string;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn("text-xs", tone === "bad" ? "text-bad" : "text-ink-faint", className)}
    >
      {children}
    </p>
  );
}

export function ReasonList({
  items,
  tone,
  className,
}: {
  items: string[];
  tone: "positive" | "concern";
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-relaxed">
          <span
            aria-hidden
            className={cn(
              "mt-0.5 shrink-0 font-mono text-xs",
              tone === "positive" ? "text-good" : "text-warn",
            )}
          >
            {tone === "positive" ? "✓" : "⚠"}
          </span>
          <span className="text-ink-soft">{item}</span>
        </li>
      ))}
    </ul>
  );
}
