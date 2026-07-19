/**
 * page.tsx (login)
 *
 * Purpose: Thin App Router page for sign-in; composes LoginForm from features/auth.
 * Connects to: features/auth/components/LoginForm.
 * Notes: Route file stays free of business logic.
 */

import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
