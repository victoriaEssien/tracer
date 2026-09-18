import Link from "next/link";
import { Suspense } from "react";

import { auth, signOut } from "@/auth";
import { GitHubButton } from "@/components/github-button";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { RepoStats } from "@/components/repo-stats";
import { SiteNavMenu } from "@/components/site-nav-menu";
import { Button } from "@/components/ui";

const LINKS = [
  { href: "/feed", label: "Queue", owns: ["/opportunities"] },
  { href: "/saved", label: "Saved", owns: [] },
  { href: "/resources", label: "First time?", owns: [] },
  { href: "/profile", label: "Profile", owns: ["/onboarding"] },
];

/** A server action, so signing out works with no client JavaScript. */
function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button variant="ghost" size="sm" type="submit">
        Sign out
      </Button>
    </form>
  );
}

export async function SiteNav() {
  const session = await auth();

  // A fixed height rather than whatever the contents come to: the queue's
  // filter bar sticks directly beneath this, and it needs a number to stick to.
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/88 backdrop-blur-sm">
      <nav
        aria-label="Main"
        className="relative mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-8"
      >
        <div className="flex items-center gap-3">
          <Link
            href={session ? "/feed" : "/"}
            className="flex shrink-0 items-center gap-2"
            aria-label="Tracer home"
          >
            <Logo size={19} />
            <span className="text-base font-semibold tracking-tight lowercase">tracer</span>
          </Link>

          {/* Streamed, so a slow or rate-limited GitHub cannot hold up a header
              that renders on every page. */}
          <Suspense fallback={null}>
            <RepoStats />
          </Suspense>
        </div>

        {session ? (
          <>
            <div className="hidden items-center gap-0.5 md:flex">
              {LINKS.map((link) => (
                <NavLink key={link.href} href={link.href} owns={link.owns}>
                  {link.label}
                </NavLink>
              ))}
              <div className="ml-1">
                <SignOutButton />
              </div>
            </div>

            <SiteNavMenu links={LINKS}>
              <SignOutButton />
            </SiteNavMenu>
          </>
        ) : (
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/resources"
              className="hidden rounded px-2 py-1.5 text-sm text-ink-soft transition-colors duration-100 hover:bg-raised hover:text-ink sm:block"
            >
              First contribution guide
            </Link>
            <GitHubButton label="Continue with GitHub" size="sm" />
          </div>
        )}
      </nav>
    </header>
  );
}
