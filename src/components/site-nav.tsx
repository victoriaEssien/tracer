import Link from "next/link";

import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui";

const LINKS = [
  { href: "/feed", label: "Queue" },
  { href: "/saved", label: "Saved" },
  { href: "/resources", label: "First time?" },
  { href: "/profile", label: "Profile" },
];

export async function SiteNav() {
  const session = await auth();

  return (
    <header className="border-b border-line">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href={session ? "/feed" : "/"}
          className="text-sm font-semibold tracking-tight lowercase"
        >
          tracer
        </Link>

        {session ? (
          <div className="flex flex-wrap items-center gap-x-0.5">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-2 py-1.5 text-sm text-ink-soft transition-colors duration-100 hover:bg-raised hover:text-ink"
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
              <Button variant="ghost" size="sm" type="submit" className="ml-1">
                Sign out
              </Button>
            </form>
          </div>
        ) : (
          <Link
            href="/resources"
            className="rounded px-2 py-1.5 text-sm text-ink-soft transition-colors duration-100 hover:bg-raised hover:text-ink"
          >
            New to open source?
          </Link>
        )}
      </nav>
    </header>
  );
}
