/**
 * BestPintsScreen.tsx
 *
 * Purpose: Upload pint photos, rate 1–10, show daily leaders and weekly top-3 vote.
 * Connects to: /ratings route, pintPhotoRepository.
 */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  loadContestSnapshot,
  ratePhoto,
  uploadPintPhoto,
  voteWeeklyWinner,
} from "@/features/ratings/data";
import type { ContestDay, ContestWeek, PintPhoto } from "@/features/ratings/types";
import styles from "./BestPintsScreen.module.css";

type Snapshot = {
  recent: PintPhoto[];
  todayLeader: ContestDay | null;
  yesterdayWinner: ContestDay | null;
  thisWeekTop3: PintPhoto[];
  lastWeek: ContestWeek;
  lastWeekFinalists: PintPhoto[];
  currentWeekKey: string;
  previousWeekKey: string;
};

function WinnerBlock({
  label,
  winner,
}: {
  label: string;
  winner: ContestDay | null;
}) {
  if (!winner || !winner.imageUrl) {
    return <p className={styles.meta}>{label}: none yet</p>;
  }
  return (
    <div className={styles.winnerBanner}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.winnerThumb}
        src={winner.imageUrl}
        alt=""
      />
      <div>
        <p className={styles.name}>{label}</p>
        <p className={styles.score}>
          {winner.displayName} · {winner.averageRating.toFixed(1)} / 10
        </p>
      </div>
    </div>
  );
}

function PhotoCard({
  photo,
  onRated,
  voteLabel,
  onVote,
}: {
  photo: PintPhoto;
  onRated?: () => void;
  voteLabel?: string;
  onVote?: () => void;
}) {
  const [score, setScore] = useState(8);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <article className={styles.card}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.image} src={photo.imageUrl} alt="" />
      <p className={styles.name}>{photo.displayName}</p>
      <p className={styles.score}>
        Avg {photo.averageRating.toFixed(1)} / 10 · {photo.ratingCount} ratings
      </p>
      {onRated ? (
        <div className={styles.rateRow}>
          <select
            className={styles.select}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            aria-label="Rating out of 10"
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
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMessage(null);
              try {
                await ratePhoto(photo.id, score);
                setMessage("Rating saved");
                onRated();
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Could not rate");
              } finally {
                setBusy(false);
              }
            }}
          >
            Rate
          </button>
        </div>
      ) : null}
      {onVote ? (
        <button
          type="button"
          className={styles.button}
          disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMessage(null);
              try {
                await onVote();
                setMessage("Vote saved");
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Could not vote");
              } finally {
                setBusy(false);
              }
            }}
        >
          {voteLabel ?? "Vote for winner"}
        </button>
      ) : null}
      {message ? <p className={styles.meta}>{message}</p> : null}
    </article>
  );
}

export function BestPintsScreen() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const next = await loadContestSnapshot();
      setSnap(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Best Pints");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className={styles.screen}>
      <p className={styles.eyebrow}>Public</p>
      <h1 className={styles.title}>Best Pints</h1>
      <p className={styles.lead}>
        Upload a pint photo, rate others out of 10. Daily leaders update from
        ratings; each week the top 3 go on display and everyone picks the winner.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Upload</h2>
        <div className={styles.row}>
          <input
            className={styles.fileInput}
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setUploading(true);
              setError(null);
              try {
                await uploadPintPhoto(file);
                await refresh();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Upload failed",
                );
              } finally {
                setUploading(false);
              }
            }}
          />
          {uploading ? <span className={styles.meta}>Uploading…</span> : null}
        </div>
        <p className={styles.meta}>
          Free accounts: 2 photos per day. Paid / admin: unlimited.
        </p>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Daily winners</h2>
        <WinnerBlock label="Today's leader" winner={snap?.todayLeader ?? null} />
        <WinnerBlock
          label="Yesterday's winner"
          winner={snap?.yesterdayWinner ?? null}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          This week&apos;s top 3 ({snap?.currentWeekKey ?? "…"})
        </h2>
        {snap?.thisWeekTop3.length ? (
          <div className={styles.grid}>
            {snap.thisWeekTop3.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onRated={refresh} />
            ))}
          </div>
        ) : (
          <p className={styles.meta}>No rated photos this week yet.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Last week — pick the winner ({snap?.previousWeekKey ?? "…"})
        </h2>
        {snap?.lastWeek.winnerId ? (
          <p className={styles.meta}>
            Current crowd favourite id: {snap.lastWeek.winnerId.slice(0, 8)}…
            (most votes so far)
          </p>
        ) : null}
        {snap?.lastWeekFinalists.length ? (
          <div className={styles.grid}>
            {snap.lastWeekFinalists.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                voteLabel="Vote for this pint"
                onVote={async () => {
                  await voteWeeklyWinner(snap.previousWeekKey, photo.id);
                  await refresh();
                }}
              />
            ))}
          </div>
        ) : (
          <p className={styles.meta}>
            Last week&apos;s top 3 will appear here once photos have ratings.
          </p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Rate recent uploads</h2>
        {snap?.recent.length ? (
          <div className={styles.grid}>
            {snap.recent.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onRated={refresh} />
            ))}
          </div>
        ) : (
          <p className={styles.meta}>No pint photos yet — be the first to upload.</p>
        )}
      </section>

      <Link className={styles.back} href="/public">
        Back to Public
      </Link>
    </div>
  );
}
