/**
 * layout.tsx
 *
 * Purpose: Root App Router layout for PintPal web (HTML document shell, metadata, global CSS).
 * Connects to: All routes under src/app. Styles via globals.css (plain CSS, not Tailwind).
 * Notes: Local font stack (no Google Fonts fetch) so CI / offline builds stay reliable.
 *        Icons point at the PintPal logo so the browser tab never falls back to Vercel.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PintPal — Drinks discovery",
  description:
    "Discover, rate, and share drinks across beer, cider, wine, spirits, and more.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/pintpal-icon.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
