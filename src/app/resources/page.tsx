import { ArrowUpRight } from "lucide-react";

import { ExternalLink, LinkButton, Panel } from "@/components/ui";

export const metadata = {
  title: "Your first contribution",
  description:
    "What actually happens when you contribute to an open-source project, and how to read what Tracer tells you about an issue.",
};

/**
 * The route in for people who have never opened a pull request on someone
 * else's repository. Read mode: structure for comprehension first.
 *
 * Every outbound link goes to primary documentation. Nothing here invents a
 * statistic, a testimonial or a promise about how a maintainer will respond.
 */
export default function ResourcesPage() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:max-w-[42rem]">
      <h1 className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
        Your first contribution
      </h1>

      <p className="mt-5 text-base leading-relaxed text-ink-soft lg:text-lg">
        Contributing to open source is a small, mechanical process wrapped in a lot of unspoken
        etiquette. The mechanics take an afternoon to learn. The etiquette is what stops most people,
        so it is written down here too.
      </p>

      <div className="mt-14 space-y-12">
        <Panel title="The shape of it">
          <ol className="space-y-5">
            {[
              {
                step: "Find an issue that is genuinely free",
                body: "Open, unassigned, no pull request already attached, and nobody saying they are on it in the comments. This is the part Tracer does for you.",
              },
              {
                step: "Say you are taking it",
                body: "A short comment on the issue. Not a request for permission, just a note so two people do not build the same thing. If a maintainer does not reply in a few days, that is usually fine to proceed on.",
              },
              {
                step: "Fork, branch, change",
                body: "Your own copy of the repository, a branch named after the change, and the smallest edit that solves the issue. Read the project's CONTRIBUTING file first; it exists to tell you the house rules.",
              },
              {
                step: "Open the pull request",
                body: "Describe what changed and why, and link the issue. Keep it to one concern. A small pull request gets reviewed; a large one waits.",
              },
              {
                step: "Expect changes to be asked for",
                body: "Review comments are not rejection. Most merged contributions go through at least one round. Answer, push another commit, move on.",
              },
            ].map((item, index) => (
              <li key={item.step} className="flex gap-4">
                <span className="mt-0.5 font-mono text-xs text-ink-faint tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-medium lg:text-base">{item.step}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft lg:text-base">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Things nobody tells you">
          <dl className="space-y-5">
            {[
              {
                q: "A label is not a promise",
                a: "A good first issue can be three years old, already claimed, or much harder than it looks. Maintainers add labels once and rarely revisit them. This is the single biggest reason people bounce off their first attempt.",
              },
              {
                q: "Silence is normal, and not personal",
                a: "Maintainers are volunteers. A pull request sitting for two weeks is ordinary. Tracer shows you a project's typical first-reply time so you can pick one where that wait is shorter.",
              },
              {
                q: "Documentation counts",
                a: "Fixing a confusing README is a real contribution, lands faster than a feature, and teaches you the codebase while you do it. It is a better first move than most people assume.",
              },
              {
                q: "You do not need permission to start",
                a: "You need to not duplicate someone else's work. Those are different things, and the second one is solved with one comment.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-medium lg:text-base">{item.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft lg:text-base">{item.a}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="How to read a Tracer score">
          <p className="text-sm leading-relaxed text-ink-soft lg:text-base">
            The number is a summary, not the point. What matters is underneath it.
          </p>
          <dl className="mt-5 space-y-4">
            {[
              {
                q: "Take it, worth a look, skip it",
                a: "The verdict is not just the score. An issue can score well and still be downgraded because somebody already called it, or because nobody can tell what finished would look like.",
              },
              {
                q: "In its favour, before you start",
                a: "Every score ships with the reasons that produced it. If a reason does not convince you, ignore the score. You know things about yourself that Tracer does not.",
              },
              {
                q: "Estimates are ranges, on purpose",
                a: "Three to ten hours means three to ten hours. Nobody can tell you how long an unfamiliar codebase will take, and a product that pretends otherwise is lying to you.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-medium lg:text-base">{item.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft lg:text-base">{item.a}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Worth reading elsewhere">
          <ul className="space-y-3.5">
            {[
              {
                title: "Open Source Guides: how to contribute",
                href: "https://opensource.guide/how-to-contribute/",
                note: "The best single primer. Written by GitHub, not selling anything.",
              },
              {
                title: "First Contributions",
                href: "https://github.com/firstcontributions/first-contributions",
                note: "A repository whose whole purpose is letting you practise the fork, branch and pull request cycle on something harmless.",
              },
              {
                title: "GitHub docs: contributing to a project",
                href: "https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project",
                note: "The exact commands, in order, for the fork and pull request flow.",
              },
            ].map((item) => (
              <li key={item.href}>
                <ExternalLink href={item.href} className="text-sm font-medium hover:text-accent lg:text-base">
                  {item.title}
                  <ArrowUpRight size={13} strokeWidth={2} aria-hidden />
                </ExternalLink>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-soft lg:text-base">{item.note}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-14 border-t border-line pt-8">
        <p className="max-w-prose text-sm leading-relaxed text-ink-soft lg:text-base">
          When you are ready, the queue does the filtering so you can spend your time on the work
          instead of the search.
        </p>
        <div className="mt-4">
          <LinkButton href="/feed" variant="primary">
            Go to your queue
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
