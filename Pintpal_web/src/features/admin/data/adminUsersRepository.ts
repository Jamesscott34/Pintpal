/**
 * adminUsersRepository.ts
 *
 * Purpose: Admin-only listing of Firestore users documents.
 * Connects to: Admin dashboard. Requires canViewAdmin on the caller (enforced in UI + rules).
 */

import { collection, getDocs } from "firebase/firestore";
import { getFirebaseFirestore } from "@/utilities/firebase";
import { Collections } from "@/utilities/firebaseConstants";
import type { UserDocument } from "@/features/auth/types";

export type AdminUserListItem = Pick<
  UserDocument,
  | "uid"
  | "email"
  | "name"
  | "role"
  | "canLogin"
  | "canViewAdmin"
  | "subscriptionPaid"
>;

export async function listAllUsersForAdmin(): Promise<AdminUserListItem[]> {
  const snap = await getDocs(collection(getFirebaseFirestore(), Collections.users));
  const users = snap.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    return {
      uid: docSnap.id,
      email: typeof data.email === "string" ? data.email : "",
      name: typeof data.name === "string" ? data.name : "",
      role: typeof data.role === "string" ? data.role : "user",
      canLogin: data.canLogin === true,
      canViewAdmin: data.canViewAdmin === true,
      subscriptionPaid: data.subscriptionPaid === true,
    };
  });
  return users.sort((a, b) =>
    (a.email || a.name).localeCompare(b.email || b.name, undefined, {
      sensitivity: "base",
    }),
  );
}
