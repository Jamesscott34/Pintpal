/**
 * layout.tsx
 *
 * Purpose: Root App Router layout for PintPal web (HTML document shell, metadata, global CSS).
 * Connects to: All routes under src/app. Styles via globals.css (plain CSS, not Tailwind).
 * Notes: Metadata is set for crawlability. Keep this file thin; feature logic stays in features/*.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PintPal — Drinks discovery, ratings & recommendations",
  description:
    "Discover, rate, and share drinks across beer, cider, wine, spirits, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
