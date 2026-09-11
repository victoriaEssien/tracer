import { Check, ListFilter, Timer } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { GitHubButton } from "@/components/github-button";
import {
  BreakdownProof,
  ClaimedProof,
  ThroughputProof,
} from "@/components/marketing/feature-proof";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { Chip, ExternalLink, InlineLabel } from "@/components/ui";
import { DIMENSION_LABELS, DIMENSION_WEIGHTS } from "@/config/scoring";
import { getUserProfile } from "@/server/db/queries";
import type { ScoreDimension } from "@/types";

const REPOSITORY = "https://github.com/victoriaEssien/tracer";

const FEATURES = [
  {
    title: "It reads the comments, not the label",
    body: "Half the issues that look free are not. Somebody says they will take it in comment seven, nobody assigns them, and the label never changes. Tracer reads the thread and tells you before you spend an evening on it.",
    Proof: ClaimedProof,
  },
  {
    title: "It knows whether work actually lands",
    body: "A project can look busy and still merge nothing from outsiders. Tracer measures real throughput: how many outside pull requests merged, how long a first review takes, how much is rotting in the queue.",
    Proof: ThroughputProof,
  },
  {
    title: "It shows the whole calculation",
    body: "Eight weighted signals, each with the reasoning that produced it, and the arithmetic on screen. Nothing hides behind the number, and the weights live in a file you can open a pull request against.",
    Proof: BreakdownProof,
  },
];

const STEPS = [
  {
    icon: Check,
    title: "Sign in with GitHub",
    body: "Read-only. Tracer never writes to your account, and asks for nothing beyond your public profile.",
  },
  {
    icon: ListFilter,
    title: "Say what you know",
    body: "Languages, frameworks, what you want to learn, and how much time you actually have this week.",
  },
  {
    icon: Timer,
    title: "Get a ranked queue",
    body: "Issues scored against your profile, each with a verdict and the reasons behind it. Save the good ones, hide the rest.",
  },
];

const FAQ = [
  {
    q: "Does it write anything to my GitHub account?",
    a: "No. Tracer only reads public data. It never comments, never assigns, never forks, and never opens a pull request on your behalf. The OAuth scope covers your public profile and email address, nothing more.",
  },
  {
    q: "Does it need AI to work?",
    a: "No. The scoring is deterministic and runs entirely on observed GitHub data. There is an optional AI layer that can summarise an issue if you press the button, and the product works fully with it switched off.",
  },
  {
    q: "What does it cost?",
    a: "Nothing. It is a free tool and the source is MIT licensed, so you can also run your own copy against your own database.",
  },
  {
    q: "How is the score calculated?",
    a: "Eight weighted signals, published in docs/scoring.md in the repository. If you think the weights are wrong, the scoring model is a file you can open a pull request against.",
  },
];

/**
 * The landing page, and the sign-in surface. Persuade mode.
 *
 * Centred composition, product-led: the hero carries a live switch between what
 * a search gives you and what Tracer gives you, built from the same components
 * the app uses so the demonstration can never drift from the real thing.
 */
export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    const profile = await getUserProfile(session.user.id);
    redirect(profile?.onboardedAt ? "/feed" : "/onboarding");
  }

  const dimensions = Object.entries(DIMENSION_WEIGHTS) as [ScoreDimension, number][];

  return (
    <main id="main">
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-20 text-center sm:px-8 sm:pt-24">
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-soft transition-colors duration-100 hover:border-line-strong hover:text-ink"
        >
          Never contributed before? Start here
        </Link>

        <h1 className="mx-auto mt-6 max-w-3xl text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl">
          Find open-source issues actually worth your time
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Searching <InlineLabel>good first issue</InlineLabel> gives you a million results and no
          way to choose. Tracer scores them against what you know and the time you have, then tells
          you which ones to take.
        </p>

        <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <GitHubButton size="lg" className="w-full sm:w-auto" />
          <ExternalLink
            href={REPOSITORY}
            className="w-full justify-center rounded-lg border border-line px-5 py-3 text-base font-medium transition-colors duration-100 hover:border-line-strong hover:bg-raised sm:w-auto"
          >
            Read the source
          </ExternalLink>
        </div>

        <p className="mt-4 text-xs text-ink-faint">
          Free, open source, and read-only. Nothing is written to your account.
        </p>

        <div className="mt-14 text-left sm:mt-16">
          <HeroDemo />
        </div>
      </section>

      <section className="border-y border-line bg-surface" aria-label="What Tracer is">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 text-xs text-ink-faint sm:px-8">
          {[
            "Eight signals per issue",
            "Every score explained",
            "No AI required",
            "MIT licensed",
            "Read-only access",
          ].map((claim) => (
            <span key={claim} className="inline-flex items-center gap-2">
              <Check size={13} strokeWidth={2.5} aria-hidden className="text-good" />
              {claim}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-8 sm:py-24" aria-labelledby="features">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="features"
            className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-4xl"
          >
            A label tells you almost nothing
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Maintainers add labels once and rarely revisit them. Everything that decides whether an
            issue is worth taking happens after that, in the thread and in the dates.
          </p>
        </div>

        <div className="mt-16 space-y-16 sm:space-y-20">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16"
            >
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <h3 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-balance">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-ink-soft">
                  {feature.body}
                </p>
              </div>
              <div className={index % 2 === 1 ? "lg:order-1" : undefined}>
                <feature.Proof />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface" aria-labelledby="how">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="how"
              className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-4xl"
            >
              Two minutes to set up
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Then the queue keeps itself current, and re-checks anything you save in case somebody
              else gets there first.
            </p>
          </div>

          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line font-mono text-xs tabular-nums">
                    {index + 1}
                  </span>
                  <step.icon size={16} strokeWidth={1.75} aria-hidden className="text-ink-faint" />
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-8 sm:py-24" aria-labelledby="model">
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2
              id="model"
              className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-4xl"
            >
              You can check the working
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
              A recommender nobody can take apart is not worth trusting. Here is the entire model,
              live from the code that runs it. Disagree with a weight and you can open a pull
              request against it.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <ExternalLink
                href={`${REPOSITORY}/blob/main/docs/scoring.md`}
                className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium transition-colors duration-100 hover:border-line-strong hover:bg-raised"
              >
                Read the scoring model
              </ExternalLink>
            </div>
          </div>

          <dl className="divide-y divide-line rounded-xl border border-line bg-surface px-5">
            {dimensions.map(([dimension, weight]) => (
              <div key={dimension} className="flex items-center gap-4 py-3">
                <dt className="w-32 shrink-0 text-sm font-medium">{DIMENSION_LABELS[dimension]}</dt>
                <dd className="flex flex-1 items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${weight * 400}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right font-mono text-xs text-ink-faint tabular-nums">
                    {Math.round(weight * 100)}%
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-y border-line bg-surface" aria-labelledby="faq">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-8 sm:py-24">
          <h2
            id="faq"
            className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-4xl"
          >
            Questions people ask
          </h2>

          <dl className="mt-10 divide-y divide-line border-t border-line">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5">
                <dt className="text-base font-medium">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-soft">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-8 sm:py-28">
        <h2 className="mx-auto max-w-2xl text-3xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
          Find something worth doing this weekend
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-soft">
          Set up a profile in two minutes and get a queue that is actually yours.
        </p>
        <div className="mx-auto mt-8 flex max-w-xs justify-center">
          <GitHubButton size="lg" className="w-full" />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          <Chip>Free</Chip>
          <Chip>Read-only</Chip>
          <Chip>No AI required</Chip>
          <Chip>Self-hostable</Chip>
        </div>
      </section>
    </main>
  );
}
