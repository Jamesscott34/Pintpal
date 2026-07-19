/**
 * page.tsx (register)
 *
 * Purpose: Thin App Router page for registration; composes RegisterForm from features/auth.
 * Connects to: features/auth/components/RegisterForm.
 * Notes: Route file stays free of business logic.
 */

import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return <RegisterForm />;
}
