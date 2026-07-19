/**
 * page.tsx (account)
 *
 * Purpose: Legacy /account route — redirects into Private profile section.
 * Connects to: /private (preferred).
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/private");
  }, [router]);
  return null;
}
