/**
 * AdminDashboard.tsx
 *
 * Purpose: Admin control centre — all users, games, chats, beer ratings, scoreboard.
 * Connects to: /admin; listAllUsersForAdmin; public routes for community surfaces.
 * Notes: Only rendered when canViewAdmin is true (AppShell also gates the route).
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks";
import {
  listAllUsersForAdmin,
  type AdminUserListItem,
} from "@/features/admin/data";
import styles from "./AdminDashboard.module.css";

export function AdminDashboard() {
  const { canViewAdmin, isLoading } = useAuth();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (isLoading || !canViewAdmin) return;
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      setError(null);
      try {
        const list = await listAllUsersForAdmin();
        if (!cancelled) setUsers(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load users.");
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canViewAdmin, isLoading]);

  if (isLoading) {
    return <p className={styles.meta}>Loading…</p>;
  }

  if (!canViewAdmin) {
    return (
      <div className={styles.hub}>
        <h1 className={styles.title}>Admin only</h1>
        <p className={styles.meta}>You do not have access to the admin dashboard.</p>
        <Link className={styles.link} href="/public">
          Back to Public
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.hub}>
      <p className={styles.eyebrow}>Admin</p>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.lead}>
        Manage users and jump into community areas. Regular members use Public for
        games, chats, ratings, and the scoreboard; you can also open every profile
        below.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick links</h2>
        <ul className={styles.list}>
          <li>
            <Link className={styles.item} href="/games/serving">
              <span className={styles.itemTitle}>Serving Rush</span>
              <span className={styles.itemMeta}>Multi-order tap + pour</span>
            </Link>
          </li>
          <li>
            <Link className={styles.item} href="/games/pour">
              <span className={styles.itemTitle}>Games</span>
              <span className={styles.itemMeta}>Pour the Perfect Pint</span>
            </Link>
          </li>
          <li>
            <Link className={styles.item} href="/public#chats">
              <span className={styles.itemTitle}>Chats</span>
              <span className={styles.itemMeta}>Community discussions</span>
            </Link>
          </li>
          <li>
            <Link className={styles.item} href="/drinks">
              <span className={styles.itemTitle}>Beer ratings</span>
              <span className={styles.itemMeta}>
                Mixes &amp; similar suggestions · 1–10 scores
              </span>
            </Link>
          </li>
          <li>
            <Link className={styles.item} href="/games/pour">
              <span className={styles.itemTitle}>Scoreboard</span>
              <span className={styles.itemMeta}>Pour accuracy standings</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>All users</h2>
        {loadingUsers ? <p className={styles.meta}>Loading users…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {!loadingUsers && !error ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Login</th>
                  <th>Plan</th>
                  <th>UID</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid}>
                    <td>{user.name || "—"}</td>
                    <td>{user.email || "—"}</td>
                    <td>{user.displayRole}</td>
                    <td>{user.canLogin ? "yes" : "no"}</td>
                    <td>
                      {user.canViewAdmin ||
                      user.subscriptionPaid ||
                      user.displayRole === "admin"
                        ? "paid"
                        : "free"}
                    </td>
                    <td className={styles.uid}>{user.uid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 ? (
              <p className={styles.meta}>No user documents found.</p>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
