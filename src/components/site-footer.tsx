import Link from "next/link";

import { Logo } from "@/components/logo";
import { ExternalLink } from "@/components/ui";

const REPOSITORY = "https://github.com/victoriaEssien/tracer";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-x-8 gap-y-8 px-4 py-10 sm:px-8">
        <div>
          <p className="flex items-center gap-2 text-base font-semibold tracking-tight lowercase">
            <Logo size={17} />
            tracer
          </p>
          <p className="mt-1.5 text-xs text-ink-faint">Find open-source work worth doing.</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-4 text-xs">
          <div>
            <p className="mb-2 font-medium text-ink">Product</p>
            <ul className="space-y-1.5 text-ink-faint">
              <li>
                <Link href="/resources" className="hover:text-ink">
                  First contribution guide
                </Link>
              </li>
              <li>
                <ExternalLink
                  href={`${REPOSITORY}/blob/main/docs/scoring.md`}
                  className="hover:text-ink"
                >
                  How scoring works
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={REPOSITORY} className="hover:text-ink">
                  Source code
                </ExternalLink>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-2 font-medium text-ink">Legal</p>
            <ul className="space-y-1.5 text-ink-faint">
              <li>
                <Link href="/privacy" className="hover:text-ink">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-ink">
                  Terms
                </Link>
              </li>
              <li>
                <ExternalLink href={`${REPOSITORY}/blob/main/LICENSE`} className="hover:text-ink">
                  MIT licence
                </ExternalLink>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </footer>
  );
}
