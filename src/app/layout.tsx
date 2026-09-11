import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

import { DiscoveryProvider } from "@/components/feed/discovery-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

/**
 * Two faces (DESIGN.md): sans for everything the interface says, mono for
 * anything measured. Self-hosted and preloaded by next/font, so neither costs
 * a round trip to a third party.
 */
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tracer",
    template: "%s · Tracer",
  },
  description:
    "Find open-source work worth doing. Tracer scores GitHub issues against what you know and the time you have, and shows its working.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Browser extensions inject attributes into <html> and <body> before React
  // hydrates (password managers, grammar checkers, colour pickers), which React
  // then reports as a mismatch it cannot patch. The suppression applies to these
  // two elements only, and to nothing inside them.
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body
        className="flex min-h-screen flex-col font-sans antialiased"
        suppressHydrationWarning
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-canvas"
        >
          Skip to content
        </a>
        <DiscoveryProvider>
          <SiteNav />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </DiscoveryProvider>
      </body>
    </html>
  );
}
