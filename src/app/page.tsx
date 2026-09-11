import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Button, Chip, EvidenceList, ExternalLink, ScoreMeter } from "@/components/ui";
import { DIMENSION_LABELS, DIMENSION_WEIGHTS } from "@/config/scoring";
import { getUserProfile } from "@/server/db/queries";
import type { ScoreDimension } from "@/types";

const REPOSITORY = "https://github.com/victoriaEssien/tracer";

/** What each scoring dimension is actually asking, in the user's terms. */
const DIMENSION_QUESTIONS: Record<ScoreDimension, string> = {
  skillMatch: "Is it written in things you already know?",
  issueSuitability: "Is it genuinely free, or has someone quietly taken it?",
  repositoryHealth: "Is the project alive, and do outside contributions actually merge?",
  issueClarity: "Does it say enough to start, and to know when you are done?",
  difficultyFit: "Does the size of it fit the time you said you have?",
  learningOpportunity: "Would it teach you something you said you wanted to learn?",
  maintainerActivity: "If you open a pull request, will anyone look at it?",
  competition: "Are three other people already circling it?",
};

/**
 * The landing page, and the sign-in surface. Persuade mode.
 *
 * The argument is carried by the product's real output and by naming the eight
 * things it checks, rather than by adjectives. Signed-in users never see it.
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
      <section className="mx-auto max-w-3xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
        <h1 className="max-w-2xl text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
          Stop searching. Start contributing.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Searching <span className="font-mono text-base">good first issue</span> returns thousands
          of results. Most are stale, already taken, or far harder than the label admits. Tracer
          reads the project, the issue and your skills, then tells you which ones are worth your
          Saturday and why.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/onboarding" });
            }}
          >
            <Button variant="primary" type="submit" className="px-4 py-2.5 text-base">
              Continue with GitHub
            </Button>
          </form>

          <Link
            href="/resources"
            className="rounded-md border border-line px-4 py-2.5 text-base font-medium transition-colors duration-100 hover:border-line-strong hover:bg-raised"
          >
            Never contributed before?
          </Link>
        </div>

        <p className="mt-4 text-xs text-ink-faint">
          Reads public GitHub data. Nothing is ever written to your account.
        </p>
      </section>

      {/* The demonstration is the argument: this is one row, unedited. */}
      <section
        className="border-y border-line bg-surface py-14 sm:py-16"
        aria-labelledby="example-heading"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2
            id="example-heading"
            className="text-2xl font-semibold tracking-[-0.02em] text-balance"
          >
            One issue, as Tracer hands it to you
          </h2>

          <div className="mt-7 border-t border-line pt-6">
            <div className="flex gap-4">
              <ScoreMeter value={79} verdict="recommended" />
              <div className="min-w-0 flex-1">
                <p className="text-base leading-snug font-medium">
                  Make the right sidebar resizable, like the left one
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
                  <span className="font-mono">openstreetmap/iD</span>
                  <span aria-hidden>·</span>
                  <span className="font-mono tabular-nums">3.9K stars</span>
                  <span aria-hidden>·</span>
                  <span className="text-warn">opened 3 years ago</span>
                  <span aria-hidden>·</span>
                  <span>active today</span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Chip>JavaScript</Chip>
                  <Chip>CSS</Chip>
                  <Chip>Medium</Chip>
                  <Chip>3-10 hours</Chip>
                </div>
                <EvidenceList
                  className="mt-3.5"
                  tone="positive"
                  items={[
                    "Written in JavaScript, which you know",
                    "Nobody is assigned and no pull request touches it",
                    "Maintainers reply to pull requests in about 14 hours",
                  ]}
                />
                <EvidenceList
                  className="mt-2.5"
                  tone="caution"
                  items={["Nobody has said what finished looks like"]}
                />
              </div>
            </div>
          </div>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-ink-soft">
            Three years old and still worth taking, because the project is alive and nobody has
            claimed it. That is the judgement a label cannot make for you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="checks">
        <h2 id="checks" className="text-2xl font-semibold tracking-[-0.02em] text-balance">
          Eight questions, asked of every issue
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
          Each one is scored, weighted and published. You can read the exact model, disagree with
          it, and open a pull request against it.
        </p>

        <dl className="mt-9 divide-y divide-line border-t border-line">
          {dimensions.map(([dimension, weight]) => (
            <div key={dimension} className="flex flex-wrap gap-x-6 gap-y-1 py-4">
              <dt className="flex w-full items-baseline justify-between gap-4 sm:w-52 sm:justify-start sm:gap-3">
                <span className="text-sm font-medium">{DIMENSION_LABELS[dimension]}</span>
                <span className="font-mono text-xs text-ink-faint tabular-nums">
                  {Math.round(weight * 100)}%
                </span>
              </dt>
              <dd className="flex-1 text-sm leading-relaxed text-ink-soft">
                {DIMENSION_QUESTIONS[dimension]}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        className="border-y border-line bg-surface py-16 sm:py-20"
        aria-labelledby="difference"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 id="difference" className="text-2xl font-semibold tracking-[-0.02em] text-balance">
            A label is not a promise
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
            Most of the wasted evenings in open source come from trusting one. Tracer reads what
            actually happened on the issue instead.
          </p>

          <div className="mt-9 grid gap-x-10 gap-y-7 sm:grid-cols-3">
            {[
              {
                title: "Somebody already called it",
                body: "Nobody was assigned, but three comments down someone said they were on it. Tracer reads the thread and tells you before you start.",
              },
              {
                title: "It has been dead for a year",
                body: "Still open, still labelled, last touched eleven months ago. Age and activity sit on the row, not one click away.",
              },
              {
                title: "A pull request already exists",
                body: "Someone linked a PR that never got reviewed. The issue looks open and is not, and no label anywhere says so.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
          Open source, and inspectable
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
          A recommender nobody can take apart is not one worth trusting. The weights, the rules and
          the code are all public under an MIT licence. Tracer should eventually be able to
          recommend its own issues.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
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

        <div className="mt-16 border-t border-line pt-8">
          <p className="text-xl font-semibold tracking-[-0.02em] text-balance">
            Find something worth doing this weekend.
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/onboarding" });
            }}
            className="mt-5"
          >
            <Button variant="primary" type="submit" className="px-4 py-2.5 text-base">
              Continue with GitHub
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
