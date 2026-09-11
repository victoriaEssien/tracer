import type { Metadata } from "next";

import { SiteNav } from "@/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tracer",
  description:
    "Find open-source work worth doing. Tracer analyses GitHub repositories and issues to tell you which contributions are actually a good fit for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
