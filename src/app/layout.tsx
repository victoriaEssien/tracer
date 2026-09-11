import type { Metadata, Viewport } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

import { DiscoveryProvider } from "@/components/feed/discovery-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import {
  BRAND,
  REPOSITORY_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/config/site";
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
  // Every relative URL below, and in each page's own metadata, resolves
  // against this. Without it Next cannot build an absolute preview image URL.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "open source contribution",
    "good first issue",
    "first time contributor",
    "github issues",
    "open source for beginners",
    "hacktoberfest",
    "find issues to work on",
    "contribute to open source",
  ],
  authors: [{ name: "victoriaEssien", url: "https://github.com/victoriaEssien" }],
  creator: "victoriaEssien",
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  other: { "source-repository": REPOSITORY_URL },
};

export const viewport: Viewport = {
  // Matches the canvas on each side, so the browser chrome on a phone is the
  // same colour as the page rather than a band above it.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.canvas },
    { media: "(prefers-color-scheme: dark)", color: "#0f1011" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  // Capped rather than locked: pinching is how some people read a phone.
  maximumScale: 5,
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
