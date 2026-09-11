import Link from "next/link";

import { auth, signOut } from "@/auth";
import { GitHubButton } from "@/components/github-button";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui";

const LINKS = [
  { href: "/feed", label: "Queue", owns: ["/opportunities"] },
  { href: "/saved", label: "Saved", owns: [] },
  { href: "/resources", label: "First time?", owns: [] },
  { href: "/profile", label: "Profile", owns: ["/onboarding"] },
];

export async function SiteNav() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/88 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-5 gap-y-2 px-4 py-3 sm:px-8">
        <Link
          href={session ? "/feed" : "/"}
          className="text-sm font-semibold tracking-tight lowercase"
        >
          tracer
        </Link>

        {session ? (
          <div className="flex flex-wrap items-center gap-x-0.5">
            {LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} owns={link.owns}>
                {link.label}
              </NavLink>
            ))}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit" className="ml-1">
                Sign out
              </Button>
            </form>
          </div>
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
