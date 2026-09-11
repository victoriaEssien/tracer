/**
 * The component vocabulary.
 *
 * Two registers share it (DESIGN.md): the console, which is rows and rules, and
 * the dossier, which is panels and prose. Anything that appears in both lives
 * here so the gear change reads as one product rather than two designs.
 */

import Link from "next/link";
import { AlertTriangle, Check, type LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { Confidence, Difficulty, Verdict } from "@/types";

/* -------------------------------------------------------------------------- */
/* Controls                                                                   */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "active";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-45";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-ink text-canvas hover:bg-ink/88",
  secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-raised",
  ghost: "text-ink-soft hover:bg-raised hover:text-ink",
  active: "border border-accent bg-accent-soft text-accent",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: "sm" | "md" }) {
  return (
    <button
      className={cn(
        BUTTON_BASE,
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5",
        BUTTON_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: "sm" | "md" }) {
  return (
    <Link
      className={cn(
        BUTTON_BASE,
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5",
        BUTTON_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
}

/** A link out to GitHub. Always announces that it leaves the app. */
export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn("inline-flex items-center gap-1", className)}
    >
      {children}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Structure                                                                  */
/* -------------------------------------------------------------------------- */

/** The dossier's container. A rule, a heading, content. Never nested. */
export function Panel({
  title,
  hint,
  children,
  className,
}: {
  title?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t border-line pt-5", className)}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {hint ? <span className="text-xs text-ink-faint">{hint}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  lede,
  actions,
}: {
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {lede ? <p className="mt-1.5 max-w-xl text-sm text-ink-soft">{lede}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-line px-6 py-16 text-center">
      {Icon ? <Icon size={20} strokeWidth={1.5} className="text-ink-faint" aria-hidden /> : null}
      <p className="text-sm font-medium">{title}</p>
      {children ? (
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">{children}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Facts                                                                      */
/* -------------------------------------------------------------------------- */

/** One fact, one chip: a technology, a difficulty, an estimate. */
export function Chip({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: "neutral" | "good" | "warn" | "bad" | "accent" }) {
  const tones = {
    neutral: "border-line text-ink-soft",
    good: "border-transparent bg-good-soft text-good",
    warn: "border-transparent bg-warn-soft text-warn",
    bad: "border-transparent bg-bad-soft text-bad",
    accent: "border-transparent bg-accent-soft text-accent",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-xs whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export const VERDICT_COPY: Record<Verdict, { label: string; tone: "good" | "warn" | "bad" }> = {
  recommended: { label: "Take it", tone: "good" },
  possible: { label: "Worth a look", tone: "warn" },
  "not-recommended": { label: "Skip it", tone: "bad" },
};

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const { label, tone } = VERDICT_COPY[verdict];
  return (
    <Chip tone={tone} className="font-medium">
      {label}
    </Chip>
  );
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  unclear: "Unclear",
};

export function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  return <Chip>{DIFFICULTY_LABEL[difficulty]}</Chip>;
}

/**
 * How well the data supports a claim. Shown only when it is not solid, because
 * a confident number built on two data points is the one thing to avoid here.
 */
export function ConfidenceNote({ confidence }: { confidence: Confidence }) {
  if (confidence === "high") return null;
  return (
    <span className="text-xs text-ink-faint">
      {confidence === "low" ? "little data" : "some data"}
    </span>
  );
}

/** Separates what the AI guessed from what GitHub reported (spec section 16). */
export function InferenceChip() {
  return (
    <Chip tone="accent" className="font-mono text-[0.65rem] tracking-wide uppercase">
      Inferred
    </Chip>
  );
}

/* -------------------------------------------------------------------------- */
/* Score                                                                      */
/* -------------------------------------------------------------------------- */

const VERDICT_TEXT = {
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
} as const;

const VERDICT_FILL = {
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
} as const;

/**
 * The score, as a number and a filled track. The track is the product's only
 * chart: it makes twenty scores comparable at a glance, which a column of
 * numerals does not.
 */
export function ScoreMeter({
  value,
  verdict,
  size = "md",
  animate = false,
  delayMs = 0,
}: {
  value: number;
  verdict: Verdict;
  size?: "md" | "lg";
  animate?: boolean;
  delayMs?: number;
}) {
  const tone = VERDICT_COPY[verdict].tone;

  return (
    <div className={size === "lg" ? "w-28" : "w-14"}>
      <div className="flex items-baseline gap-0.5">
        <span
          className={cn(
            "font-mono font-semibold tabular-nums",
            size === "lg" ? "text-4xl" : "text-lg",
            VERDICT_TEXT[tone],
          )}
        >
          {value}
        </span>
        <span className={cn("text-xs font-medium", VERDICT_TEXT[tone])}>%</span>
      </div>
      <div
        className={cn("mt-1 overflow-hidden rounded-full bg-raised", size === "lg" ? "h-1.5" : "h-1")}
        role="img"
        aria-label={`Contribution fit ${value} out of 100. ${VERDICT_COPY[verdict].label}.`}
      >
        <div
          className={cn("h-full rounded-full", VERDICT_FILL[tone], animate && "meter-fill")}
          style={{
            width: `${Math.round(Math.min(100, Math.max(0, value)))}%`,
            animationDelay: animate ? `${delayMs}ms` : undefined,
          }}
        />
      </div>
    </div>
  );
}

/** A plain proportion bar, for scoring dimensions rather than the total. */
export function Bar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-raised">
      <div
        className="h-full rounded-full bg-ink-faint"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Evidence                                                                   */
/* -------------------------------------------------------------------------- */

export function EvidenceList({
  items,
  tone,
  className,
}: {
  items: string[];
  tone: "positive" | "caution";
  className?: string;
}) {
  if (items.length === 0) return null;
  const Icon = tone === "positive" ? Check : AlertTriangle;

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
          <Icon
            size={14}
            strokeWidth={2}
            aria-hidden
            className={cn("mt-1 shrink-0", tone === "positive" ? "text-good" : "text-warn")}
          />
          <span className="text-ink-soft">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A polite live region. Progress and error text is useless to a screen reader
 * if it only appears visually, and every status message here is transient.
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
