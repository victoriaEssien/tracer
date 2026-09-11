"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * A navigation link that knows whether it is the page you are on.
 *
 * The deep dive belongs to the queue, so `/opportunities/...` keeps Queue lit
 * rather than leaving every link looking equally inactive.
 */
export function NavLink({
  href,
  owns = [],
  children,
}: {
  href: string;
  /** Extra path prefixes this link should claim. */
  owns?: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || [href, ...owns].some((prefix) => pathname.startsWith(`${prefix}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded px-2 py-1.5 text-sm transition-colors duration-100",
        active ? "bg-raised font-medium text-ink" : "text-ink-soft hover:bg-raised hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
