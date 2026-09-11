import Link from "next/link";

import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui";

const LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/saved", label: "Saved" },
  { href: "/profile", label: "Profile" },
];

export async function SiteNav() {
  const session = await auth();

  return (
    <header className="border-b border-line bg-surface">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
        <Link href={session ? "/feed" : "/"} className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold tracking-tight">tracer</span>
          <span className="hidden text-xs text-ink-faint sm:inline">
            find open-source work worth doing
          </span>
        </Link>

        {session ? (
          <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-1.5 text-sm text-ink-soft transition hover:bg-raised hover:text-ink sm:px-2.5"
              >
                {link.label}
              </Link>
            ))}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="ghost" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
