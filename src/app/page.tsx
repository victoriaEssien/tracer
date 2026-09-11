import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Button, Card } from "@/components/ui";
import { getUserProfile } from "@/server/db/queries";

/**
 * The landing page, and the sign-in surface.
 *
 * Signed-in users never see it: they go to onboarding if they have not finished
 * it, and to the feed if they have.
 */
export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    const profile = await getUserProfile(session.user.id);
    redirect(profile?.onboardedAt ? "/feed" : "/onboarding");
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-20">
      <p className="font-mono text-xs tracking-[0.2em] text-ink-faint uppercase">Tracer</p>

      <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
        Find open-source work worth doing.
      </h1>

      <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
        Searching <span className="font-mono text-sm">good first issue</span> returns thousands of
        results. Plenty of them are stale, already claimed, badly specified, or far harder than the
        label suggests. Tracer reads the repository, the issue and your own skills, then tells you
        whether a contribution is actually worth your time — and why it thinks so.
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/onboarding" });
        }}
        className="mt-8"
      >
        <Button variant="primary" type="submit" className="px-4 py-2">
          Continue with GitHub
        </Button>
      </form>

      <div className="mt-16 grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "A score, and its reasons",
            body: "Every recommendation carries the reasoning that produced it. No number appears on its own.",
          },
          {
            title: "A plain verdict",
            body: "Take it, consider it, or skip it — with the things you should know before you start.",
          },
          {
            title: "No pretend certainty",
            body: "Estimates stay estimates. Labels are treated as evidence, never as proof.",
          },
        ].map((item) => (
          <Card key={item.title} className="p-4">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.body}</p>
          </Card>
        ))}
      </div>

      <p className="mt-10 text-xs text-ink-faint">
        Tracer reads public GitHub data only. The scoring methodology is published in{" "}
        <span className="font-mono">docs/scoring.md</span>.
      </p>
    </main>
  );
}
