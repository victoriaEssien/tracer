import { Panel } from "@/components/ui";

export const metadata = {
  title: "Terms",
  description: "What Tracer promises, what it does not, and what is expected of you.",
};

const UPDATED = "11 September 2026";

export default function TermsPage() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
        Terms
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-soft lg:text-lg">
        Short, because the service is small. Last updated {UPDATED}.
      </p>

      <div className="mt-12 space-y-10">
        <Panel title="What Tracer is">
          <p className="text-sm leading-relaxed text-ink-soft lg:text-base">
            A tool that reads public GitHub data and offers an opinion about which issues are worth
            contributing to. It is provided free and as it is, with no guarantee that it will be
            available, accurate, or maintained.
          </p>
        </Panel>

        <Panel title="The recommendations are estimates">
          <p className="text-sm leading-relaxed text-ink-soft lg:text-base">
            Every score, difficulty, time range and verdict is an inference drawn from public data.
            They will sometimes be wrong. An issue Tracer calls free may have been taken in a
            conversation it cannot see; a two hour estimate may turn into a weekend.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft lg:text-base">
            Treat them as a starting point for your own judgement, never as a promise. The reasoning
            behind every score is shown precisely so you can disagree with it.
          </p>
        </Panel>

        <Panel title="What is expected of you">
          <ul className="space-y-2.5 text-sm leading-relaxed text-ink-soft lg:text-base">
            {[
              "Follow the rules of the projects you contribute to. Their contributing guides and codes of conduct are theirs, not Tracer's, and Tracer has no standing to waive them.",
              "Be decent to maintainers. They are volunteers, and a recommendation from a tool is not a claim on anybody's time.",
              "Do not use Tracer to scrape GitHub, to automate contributions, or in a way that breaks GitHub's own terms.",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span aria-hidden className="text-ink-faint">
                  &bull;
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Your account">
          <p className="text-sm leading-relaxed text-ink-soft lg:text-base">
            You sign in with GitHub, and your use of GitHub remains governed by GitHub&apos;s terms.
            Access can be revoked from your GitHub settings at any time. Access may also be
            withdrawn here if an account is used to abuse the service or the projects it points at.
          </p>
        </Panel>

        <Panel title="The software itself">
          <p className="text-sm leading-relaxed text-ink-soft lg:text-base">
            Tracer&apos;s source is MIT licensed, and the licence governs the code. These terms cover
            this hosted instance of it. You are free to run your own, and nothing here restricts
            that.
          </p>
        </Panel>

        <Panel title="Changes">
          <p className="text-sm leading-relaxed text-ink-soft lg:text-base">
            These terms may change as the product does. The date at the top says when they last did.
          </p>
        </Panel>
      </div>
    </main>
  );
}
