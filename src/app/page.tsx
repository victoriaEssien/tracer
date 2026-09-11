import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Button, Chip, EvidenceList, ScoreMeter } from "@/components/ui";
import { getUserProfile } from "@/server/db/queries";

/**
 * The landing page, and the sign-in surface. Persuade mode.
 *
 * The argument is made by showing the product's actual output rather than
 * describing it: a real scored row, with the reasoning attached. Signed-in
 * users never see this page.
 */
export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    const profile = await getUserProfile(session.user.id);
    redirect(profile?.onboardedAt ? "/feed" : "/onboarding");
  }

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-balance sm:text-5xl">
        Find open-source work worth doing.
      </h1>

      <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
        Searching <span className="font-mono text-sm">good first issue</span> returns thousands of
        results. Most are stale, already taken, badly specified, or far harder than the label
        admits. Tracer reads the repository, the issue and your own skills, then tells you whether
        an issue is worth your Saturday and why it thinks so.
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/onboarding" });
        }}
        className="mt-8"
      >
        <Button variant="primary" type="submit" className="px-4 py-2.5">
          Continue with GitHub
        </Button>
      </form>

      <p className="mt-3 text-xs text-ink-faint">
        Reads public GitHub data. Nothing is written to your account.
      </p>

      {/* The demonstration is the argument: this is what one row looks like. */}
      <section className="mt-20" aria-labelledby="example">
        <h2 id="example" className="text-xs tracking-wide text-ink-faint uppercase">
          What you get back
        </h2>

        <div className="mt-4 border-y border-line py-5">
          <div className="flex gap-4">
            <ScoreMeter value={79} verdict="recommended" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.9375rem] leading-snug font-medium">
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
                className="mt-3"
                tone="positive"
                items={[
                  "Written in JavaScript, which you have listed as experience",
                  "Nobody is assigned and no pull request references the issue",
                  "Maintainers replied to recent pull requests within about 14 hours",
                ]}
              />
              <EvidenceList
                className="mt-2"
                tone="caution"
                items={["The issue does not spell out what finished would look like"]}
              />
            </div>
          </div>
        </div>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
          Every score comes with the reasoning that produced it, and the weights behind it are
          published. Labels are treated as evidence, never as proof: a{" "}
          <span className="font-mono text-xs">good first issue</span> that three people already
          claimed in the comments is not a good first issue.
        </p>
      </section>
    </main>
  );
}
