/**
 * DrinkRatingsScreen.tsx
 *
 * Purpose: Post beer/mixes (e.g. Heineken with lemon), rate 1–10, see similar suggestions.
 */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  createDrinkEntry,
  listRecentDrinks,
  listTopRatedDrinks,
  rateDrink,
  suggestSimilar,
} from "@/features/drinks/data";
import type { DrinkEntry } from "@/features/drinks/types";
import styles from "./DrinkRatingsScreen.module.css";

export function DrinkRatingsScreen() {
  const [catalog, setCatalog] = useState<DrinkEntry[]>([]);
  const [top, setTop] = useState<DrinkEntry[]>([]);
  const [title, setTitle] = useState("");
  const [baseBeer, setBaseBeer] = useState("");
  const [mixins, setMixins] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    setError(null);
    const [recent, nicest] = await Promise.all([
      listRecentDrinks(),
      listTopRatedDrinks(),
    ]);
    setCatalog(recent);
    setTop(nicest);
  }, []);

  useEffect(() => {
    void refresh().catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load drinks");
    });
  }, [refresh]);

  return (
    <div className={styles.screen}>
      <p className={styles.eyebrow}>Public</p>
      <h1 className={styles.title}>Beer ratings</h1>
      <p className={styles.lead}>
        Post a beer or mix — like Heineken with lemon — rate others out of 10,
        and see suggestions for similar drinks. Best Pints photo contest is
        separate under Best Pints.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Add a drink</h2>
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await createDrinkEntry({ title, baseBeer, mixins, notes });
              setTitle("");
              setBaseBeer("");
              setMixins("");
              setNotes("");
              await refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not add drink");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            className={styles.input}
            placeholder="Title (e.g. Heineken with lemon)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className={styles.input}
            placeholder="Base beer (e.g. Heineken)"
            value={baseBeer}
            onChange={(e) => setBaseBeer(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Mix-ins (e.g. lemon, lime)"
            value={mixins}
            onChange={(e) => setMixins(e.target.value)}
          />
          <textarea
            className={styles.textarea}
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button className={styles.button} type="submit" disabled={busy}>
            {busy ? "Saving…" : "Post drink"}
          </button>
        </form>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Nicest beers so far</h2>
        {top.length === 0 ? (
          <p className={styles.meta}>No rated drinks yet — be the first.</p>
        ) : (
          <ul className={styles.list}>
            {top.map((d) => (
              <li key={d.id} className={styles.card}>
                <p className={styles.name}>{d.title}</p>
                <p className={styles.score}>
                  {d.averageRating.toFixed(1)} / 10 · {d.ratingCount} ratings
                  {d.baseBeer ? ` · ${d.baseBeer}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Rate &amp; similar suggestions</h2>
        {catalog.length === 0 ? (
          <p className={styles.meta}>No drinks posted yet.</p>
        ) : (
          <ul className={styles.list}>
            {catalog.map((d) => {
              const similar = suggestSimilar(d, catalog);
              const score = scores[d.id] ?? 8;
              return (
                <li key={d.id} className={styles.card}>
                  <p className={styles.name}>{d.title}</p>
                  <p className={styles.meta}>
                    by {d.displayName}
                    {d.mixins ? ` · ${d.mixins}` : ""}
                    {d.notes ? ` — ${d.notes}` : ""}
                  </p>
                  <p className={styles.score}>
                    Avg {d.averageRating.toFixed(1)} / 10 · {d.ratingCount}{" "}
                    ratings
                  </p>
                  <div className={styles.rateRow}>
                    <select
                      className={styles.select}
                      value={score}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [d.id]: Number(e.target.value),
                        }))
                      }
                      aria-label={`Rate ${d.title}`}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.button}
                      onClick={async () => {
                        try {
                          await rateDrink(d.id, score);
                          await refresh();
                        } catch (err) {
                          setError(
                            err instanceof Error ? err.message : "Rate failed",
                          );
                        }
                      }}
                    >
                      Rate
                    </button>
                  </div>
                  {similar.length > 0 ? (
                    <>
                      <p className={styles.meta}>Similar suggestions</p>
                      <ul className={styles.similar}>
                        {similar.map((s) => (
                          <li key={s.id}>
                            {s.title}
                            {s.averageRating > 0
                              ? ` · ${s.averageRating.toFixed(1)}/10`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link className={styles.back} href="/ratings">
        Best Pints photo contest
      </Link>
      <Link className={styles.back} href="/public">
        Back to Public
      </Link>
    </div>
  );
}
