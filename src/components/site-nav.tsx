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
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-5 py-3">
        <Link href={session ? "/feed" : "/"} className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold tracking-tight">tracer</span>
          <span className="hidden text-xs text-ink-faint sm:inline">
            find open-source work worth doing
          </span>
        </Link>

        {session ? (
          <div className="flex items-center gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2.5 py-1.5 text-sm text-ink-soft transition hover:bg-raised hover:text-ink"
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
