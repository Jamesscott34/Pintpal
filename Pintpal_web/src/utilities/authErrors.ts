/**
 * authErrors.ts
 *
 * Purpose: Map Firebase Auth error codes to clearer user-facing messages.
 * Connects to: useAuth / login + register forms.
 */

export function mapAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : "Something went wrong.";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return (
        "Email or password is incorrect. If you registered with Google, use Continue with Google, " +
        "or reset the password in Firebase Auth. Trim any leading/trailing spaces."
      );
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/email-already-in-use":
      return "An account already exists for that email. Sign in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      if (
        error instanceof Error &&
        (error.name === "LoginDeniedError" ||
          message.toLowerCase().includes("canlogin"))
      ) {
        return "This account cannot sign in (canLogin is false).";
      }
      return message;
  }
}
