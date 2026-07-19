/**
 * next.config.ts
 *
 * Purpose: Next.js config for PintPal web, including static export for Firebase Hosting.
 * Connects to: npm run build → out/ directory deployed by firebase.json hosting.
 * Notes: Static HTML/CSS/JS export so Google Search Console can crawl public pages.
 *        Auth and games use client-side Firebase; no Node server required on Hosting.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
