"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The navigation on a phone.
 *
 * Five targets will not fit across a 360px header, and letting them wrap makes
 * the sticky header two rows tall on the one screen with the least room to
 * spare. Behind a button the header stays one row everywhere, which is also
 * what the queue's filter bar sticks itself beneath.
 */
export function SiteNavMenu({
  links,
  children,
}: {
  links: { href: string; label: string; owns: string[] }[];
  /** The sign-out form, which has to stay a server action. */
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Following a link should put the menu away, and arriving anywhere new means
  // the choice it was open for has been made.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-ink-soft transition-colors duration-100 hover:bg-raised hover:text-ink md:hidden"
      >
        {open ? (
          <X size={20} strokeWidth={2} aria-hidden />
        ) : (
          <Menu size={20} strokeWidth={2} aria-hidden />
        )}
      </button>

      {open ? (
        <>
          {/* Tapping the page behind is the gesture people try first. Absolute
              rather than fixed: the header is blurred, and a backdrop filter
              makes its own containing block, which fixed would anchor to. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-x-0 top-full z-10 h-[100dvh] cursor-default bg-ink/10 md:hidden"
          />

          <div
            id={panelId}
            className="absolute inset-x-0 top-full z-20 border-b border-line bg-surface shadow-[0_12px_32px_-16px_rgba(0,0,0,0.3)] md:hidden"
          >
            <div className="px-3 py-2">
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  [link.href, ...link.owns].some((prefix) => pathname.startsWith(`${prefix}/`));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center rounded-md px-3 text-base transition-colors duration-100",
                      active ? "bg-raised font-medium text-ink" : "text-ink-soft",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-line px-3 py-2 [&_button]:min-h-11 [&_button]:w-full [&_button]:justify-start [&_button]:px-3 [&_button]:text-base">
              {children}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
