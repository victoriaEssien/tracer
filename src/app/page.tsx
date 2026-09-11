import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Button, Chip, EvidenceList, ExternalLink, ScoreMeter } from "@/components/ui";
import { DIMENSION_LABELS, DIMENSION_WEIGHTS } from "@/config/scoring";
import { getUserProfile } from "@/server/db/queries";
import type { ScoreDimension } from "@/types";

const REPOSITORY = "https://github.com/victoriaEssien/tracer";

/**
 * Three issues that pass every filter a search can apply, and should not be
 * taken. The patterns are the ones Tracer finds constantly; the projects are
 * left unnamed, because using a real maintainer's issue as a cautionary tale
 * on a marketing page is not a thing to do to someone.
 */
const SPECIMENS = [
  {
    labels: ["good first issue", "help wanted"],
    title: "Add a dark mode toggle to the settings panel",
    meta: "TypeScript project, 12k stars, active this week",
    verdict: "Someone took it eight months ago",
    reveal:
      "Comment seven of thirty-one: “I'd like to work on this.” Nobody was ever assigned, the label never changed, and the issue has looked open ever since.",
  },
  {
    labels: ["good first issue", "documentation"],
    title: "Update the installation guide for the new CLI",
    meta: "Go project, 4k stars, labelled two years ago",
    verdict: "The work already shipped",
    reveal:
      "A pull request linked from the thread was merged last spring. The issue was never closed, so it still answers every search for beginner-friendly work.",
  },
  {
    labels: ["good first issue", "bug"],
    title: "Fix the alignment of the toolbar icons on Safari",
    meta: "JavaScript project, 2k stars, opened in 2017",
    verdict: "Nobody wants it any more",
    reveal:
      "Eight years open, no comment since 2019, and the component it describes was rewritten twice. Fixing it would be a pull request into a room with nobody in it.",
  },
];

/** What each scoring dimension is actually asking, in the user's terms. */
const DIMENSION_QUESTIONS: Record<ScoreDimension, string> = {
  skillMatch: "Written in things you already know?",
  issueSuitability: "Genuinely free, or quietly taken?",
  repositoryHealth: "Alive, and do outside contributions merge?",
  issueClarity: "Enough detail to start, and to finish?",
  difficultyFit: "The size of it against the time you have",
  learningOpportunity: "Would it teach you what you wanted?",
  maintainerActivity: "Will anyone review your pull request?",
  competition: "Are three other people circling it?",
};

/**
 * The landing page, and the sign-in surface. Persuade mode.
 *
 * Structure is problem-first: the reader meets three wasted Saturdays before
 * they meet the product, so the pitch answers something they have just felt
 * rather than announcing itself. Signed-in users never see this page.
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
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-20">
        <h1 className="max-w-3xl text-[2.75rem] leading-[0.98] font-semibold tracking-[-0.035em] text-balance sm:text-6xl">
          A label is not a promise.
        </h1>

        <div className="mt-10 grid gap-x-16 gap-y-8 lg:grid-cols-[1fr_20rem]">
          <p className="max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            Searching <span className="font-mono text-base sm:text-lg">good first issue</span>{" "}
            returns thousands of results. They all look the same from the outside, and most of them
            will cost you an evening. Here are three that pass every filter a search can apply.
          </p>

          <div className="lg:pt-2">
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/onboarding" });
              }}
            >
              <Button variant="primary" type="submit" className="w-full px-4 py-3 text-base">
                Continue with GitHub
              </Button>
            </form>
            <Link
              href="/resources"
              className="mt-2 block w-full rounded-md border border-line px-4 py-3 text-center text-base font-medium transition-colors duration-100 hover:border-line-strong hover:bg-raised"
            >
              Never contributed before?
            </Link>
            <p className="mt-3 text-xs text-ink-faint">
              Reads public GitHub data. Nothing is written to your account.
            </p>
          </div>
        </div>
      </section>

      {/* The argument stays on screen while the evidence scrolls past it. */}
      <section className="border-t border-line bg-surface" aria-labelledby="specimens">
        <div className="mx-auto grid max-w-5xl gap-x-16 gap-y-10 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[16rem_1fr]">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <h2 id="specimens" className="text-2xl font-semibold tracking-[-0.02em] text-balance">
              Three wasted Saturdays
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Every one of these is open, labelled for newcomers, and in a healthy project. The
              thing that disqualifies it is never in the label. It is in the thread, the dates, or a
              pull request nobody closed.
            </p>
            <p className="mt-4 text-xs text-ink-faint">
              Patterns Tracer finds daily. The projects are left unnamed on purpose.
            </p>
          </div>

          <ol className="divide-y divide-line border-y border-line">
            {SPECIMENS.map((specimen, index) => (
              <li key={specimen.title} className="grid gap-4 py-7 sm:grid-cols-[2.5rem_1fr]">
                <span
                  aria-hidden
                  className="font-mono text-xs text-ink-faint tabular-nums sm:pt-1"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {specimen.labels.map((label) => (
                      <Chip key={label}>{label}</Chip>
                    ))}
                  </div>
                  <p className="mt-2.5 text-lg leading-snug font-medium text-balance">
                    {specimen.title}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">{specimen.meta}</p>

                  <div className="mt-4 flex gap-2.5">
                    <AlertTriangle
                      size={15}
                      strokeWidth={2}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-warn"
                    />
                    <div>
                      <p className="text-sm font-semibold text-warn">{specimen.verdict}</p>
                      <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink-soft">
                        {specimen.reveal}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-24" aria-labelledby="turn">
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2
              id="turn"
              className="text-3xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-4xl"
            >
              Tracer reads the thread, not the label.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft">
              Eight questions, asked of every issue it finds, weighted into one number and shown
              with the reasoning that produced it. The weights are published. Disagree with them and
              you can open a pull request against them.
            </p>
          </div>

          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-1 lg:gap-y-4">
            {dimensions.map(([dimension, weight]) => (
              <div key={dimension} className="border-t border-line pt-3">
                <dt className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{DIMENSION_LABELS[dimension]}</span>
                  <span className="font-mono text-xs text-ink-faint tabular-nums">
                    {Math.round(weight * 100)}%
                  </span>
                </dt>
                <dd className="mt-0.5 text-sm leading-snug text-ink-soft">
                  {DIMENSION_QUESTIONS[dimension]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The payoff. Real output, real project, named because it is praise. */}
      <section className="border-y border-line bg-surface" aria-labelledby="payoff">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-20">
          <h2 id="payoff" className="text-2xl font-semibold tracking-[-0.02em] text-balance">
            And this one, which is worth taking
          </h2>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:gap-10">
            <ScoreMeter value={79} verdict="recommended" size="lg" />

            <div className="min-w-0 flex-1">
              <p className="text-xl leading-snug font-medium text-balance">
                Make the right sidebar resizable, like the left one
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
                <ExternalLink
                  href="https://github.com/openstreetmap/iD/issues/9872"
                  className="font-mono hover:text-accent"
                >
                  openstreetmap/iD
                </ExternalLink>
                <span aria-hidden>·</span>
                <span className="font-mono tabular-nums">3.9K stars</span>
                <span aria-hidden>·</span>
                <span className="text-warn">opened 3 years ago</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip>JavaScript</Chip>
                <Chip>TypeScript</Chip>
                <Chip>Medium</Chip>
                <Chip>3-10 hours</Chip>
              </div>

              <div className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                <EvidenceList
                  tone="positive"
                  items={[
                    "Written in JavaScript, which you know",
                    "Nobody is assigned and no pull request touches it",
                    "Active in the last month",
                  ]}
                />
                <EvidenceList
                  tone="caution"
                  items={["Nobody has said what finished looks like"]}
                />
              </div>
            </div>
          </div>

          <p className="mt-9 max-w-xl text-base leading-relaxed text-ink-soft">
            Three years old and still worth taking, because the project is alive and nobody has
            claimed it. Age alone would have thrown this one away. So would a label.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
              You can check the working
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-soft">
              A recommender nobody can take apart is not worth trusting. The weights, the rules and
              the code are public under an MIT licence. Tracer should eventually be able to
              recommend its own issues.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <ExternalLink
                href={REPOSITORY}
                className="rounded-md border border-line px-3.5 py-2 text-sm font-medium transition-colors duration-100 hover:border-line-strong hover:bg-raised"
              >
                Read the source
              </ExternalLink>
              <ExternalLink
                href={`${REPOSITORY}/blob/main/docs/scoring.md`}
                className="rounded-md border border-line px-3.5 py-2 text-sm font-medium transition-colors duration-100 hover:border-line-strong hover:bg-raised"
              >
                Read the scoring model
              </ExternalLink>
            </div>
          </div>

          <div className="lg:border-l lg:border-line lg:pl-16">
            <p className="text-2xl leading-[1.15] font-semibold tracking-[-0.02em] text-balance">
              Find something worth doing this weekend.
            </p>
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/onboarding" });
              }}
              className="mt-6"
            >
              <Button variant="primary" type="submit" className="px-4 py-3 text-base">
                Continue with GitHub
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
