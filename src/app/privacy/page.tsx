import { Panel } from "@/components/ui";

export const metadata = {
  title: "Privacy",
  description: "What Tracer stores, why, who else sees it, and how to get rid of it.",
};

const UPDATED = "11 September 2026";

/**
 * Written from what the code actually does, not from a template. Every claim
 * here is checkable against `src/server/db/schema.ts`.
 */
export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
        Privacy
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-soft lg:text-lg">
        Tracer needs very little about you, and what it does need is listed here in full. Last
        updated {UPDATED}.
      </p>

      <div className="mt-12 space-y-10">
        <Panel title="What is stored">
          <dl className="space-y-4">
            {[
              {
                q: "From GitHub, when you sign in",
                a: "Your GitHub user id, username, display name, email address and avatar URL, plus the OAuth access token that lets Tracer read public GitHub data as you. The token is stored so that requests count against your own rate limit rather than a shared one.",
              },
              {
                q: "What you tell Tracer about yourself",
                a: "The languages, frameworks and tools you know, what you want to learn, the subjects you care about, the kinds of contribution you want, the time you have, and your experience level.",
              },
              {
                q: "What you do here",
                a: "Which issues you save, hide and open, and the score and technologies attached to each of those actions. This is what lets Tracer adjust to you, and it is shown back to you on your profile page rather than kept hidden.",
              },
              {
                q: "Public GitHub data",
                a: "Repositories and issues Tracer has collected and scored, cached so it does not have to ask GitHub the same question repeatedly. This is public information about other people's projects, not about you.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-medium lg:text-base">{item.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft lg:text-base">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="What is not">
          <ul className="space-y-2.5 text-sm leading-relaxed text-ink-soft lg:text-base">
            {[
              "No analytics, no tracking pixels, no advertising identifiers, no third-party scripts.",
              "No private repository data. The OAuth scope Tracer asks for covers your public profile and email address only.",
              "Nothing is ever written to your GitHub account. Tracer does not comment, assign, fork or open pull requests on your behalf.",
              "No cookies beyond the one that keeps you signed in.",
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

        <Panel title="Who else handles it">
          <dl className="space-y-4">
            {[
              {
                q: "GitHub",
                a: "Authenticates you and provides every piece of repository and issue data Tracer analyses.",
              },
              {
                q: "Neon",
                a: "Hosts the PostgreSQL database where everything above is stored.",
              },
              {
                q: "Vercel",
                a: "Hosts and serves the application, and processes the requests your browser makes to it.",
              },
              {
                q: "OpenAI, only if the AI layer is switched on",
                a: "When you press the button that asks for a reading of an issue, the text of that public issue and its repository details are sent to generate a summary. Your profile and your activity are not sent. The feature is off unless an operator enables it, and the product works fully without it.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-medium lg:text-base">{item.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft lg:text-base">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Getting rid of it">
          <p className="text-sm leading-relaxed text-ink-soft lg:text-base">
            You can revoke Tracer&apos;s access at any time from your GitHub settings, under Applications
            and then Authorized OAuth Apps. That immediately stops Tracer reading anything as you.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft lg:text-base">
            To have your account and everything attached to it deleted from the database, ask. All
            of your rows are keyed to your user id and are removed together, including your profile,
            skills, saved and hidden issues, and activity history.
          </p>
        </Panel>

        <Panel title="Running your own">
          <p className="text-sm leading-relaxed text-ink-soft lg:text-base">
            Tracer is MIT licensed and open source. If you would rather not hand your data to anyone
            else at all, you can run it yourself against your own database and your own GitHub OAuth
            app, and none of the above applies.
          </p>
        </Panel>
      </div>
    </main>
  );
}
