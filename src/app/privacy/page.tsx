import type { Metadata } from "next";

import { Panel } from "@/components/ui";

const DESCRIPTION = "What Tracer stores, why, who else sees it, and how to get rid of it.";

export const metadata: Metadata = {
  title: "Privacy",
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy · Tracer", description: DESCRIPTION, url: "/privacy" },
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
                a: "Your GitHub username, display name, email address and profile picture, plus the key GitHub gives Tracer to read public information on your behalf. That key is kept so your searches count against your own GitHub allowance instead of a shared one, which is what keeps the queue fast."
              },
              {
                q: "What you tell Tracer about yourself",
                a: "The languages, frameworks and tools you know, what you want to learn, the subjects you care about, the kinds of contribution you want, the time you have, and your experience level.",
              },
              {
                q: "What you do here",
                a: "Which issues you save, hide and open, along with the score and the technologies attached to each one. This is what lets Tracer adjust to you, and you can see all of it on your profile page rather than it being kept from you.",
              },
              {
                q: "Public GitHub data",
                a: "Projects and issues Tracer has already looked at and scored, kept for a while so it does not have to ask GitHub the same question over and over. This is public information about other people's projects, not about you.",
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
              "No analytics, no tracking pixels, no advertising, and no scripts from anyone else.",
              "Nothing from your private projects. The permission Tracer asks GitHub for covers your public profile and email address, and nothing else.",
              "Nothing is ever written to your GitHub account. Tracer does not comment, assign, fork or open pull requests on your behalf.",
              "No cookies beyond the single one that keeps you signed in.",
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
                a: "Signs you in, and provides every project and issue Tracer reads.",
              },
              {
                q: "Neon",
                a: "Stores everything listed above, on Tracer's behalf.",
              },
              {
                q: "Vercel",
                a: "Runs the site itself and handles the pages your browser asks for.",
              },
              {
                q: "OpenAI, only if the AI layer is switched on",
                a: "Only when you press the button that asks for a reading of an issue. The text of that public issue and its project details are sent off to write the summary. Your profile and what you have been looking at are never sent. The feature is switched off unless whoever runs Tracer turns it on, and everything else works the same without it.",
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
            You can cut off Tracer&apos;s access at any time from your GitHub settings, under
            Applications. That stops it reading anything on your behalf straight away.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft lg:text-base">
            To have your account and everything attached to it deleted, just ask. It all goes
            together: your profile, your skills, your saved and hidden issues, and the record of
            what you have looked at.
          </p>
        </Panel>

        <Panel title="Running your own">
          <p className="text-sm leading-relaxed text-ink-soft lg:text-base">
            Tracer is open source and free to copy. If you would rather not hand anything to anyone
            else at all, you can run your own private copy, and none of the above applies to it.
          </p>
        </Panel>
      </div>
    </main>
  );
}
