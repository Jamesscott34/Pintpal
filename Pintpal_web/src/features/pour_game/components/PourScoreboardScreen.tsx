/**
 * PourScoreboardScreen.tsx
 *
 * Purpose: Public pour scoreboard + profile bests + opt-in.
 * Connects to: pourGameScoreRepository; PourGameHub.
 * Notes: Filter practice vs timed. Separate from ratings/contribution boards.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadPourProfile,
  loadPublicPourScoreboard,
  setPourScoreboardOptIn,
  type PourScoreboardEntry,
  type PourScoreMode,
} from "../data/pourGameScoreRepository";
import { TIMED_DURATIONS_SECONDS } from "../timedMode";
import styles from "./PourScoreboardScreen.module.css";

export function PourScoreboardScreen() {
  const [mode, setMode] = useState<PourScoreMode>("practice");
  const [duration, setDuration] = useState(60);
  const [entries, setEntries] = useState<PourScoreboardEntry[]>([]);
  const [status, setStatus] = useState("Loading…");
  const [profileLine, setProfileLine] = useState("Sign in to see profile bests.");
  const [optIn, setOptIn] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await loadPourProfile();
      if (!profile) {
        setProfileLine("Sign in to save and view profile pour scores.");
        setOptIn(false);
        return;
      }
      setOptIn(!!profile.pourGameScoreboardOptIn);
      const practice =
        profile.pourGameBestPracticeAccuracy != null
          ? `${profile.pourGameBestPracticeAccuracy.toFixed(1)}%`
          : "—";
      const timed = Object.entries(profile.pourGameBestTimedAccuracySums ?? {})
        .map(([k, v]) => `${k}s: ${v.toFixed(1)}`)
        .join(", ");
      setProfileLine(
        `Your profile · Practice best: ${practice} · Timed bests: ${timed || "—"}`,
      );
    } catch {
      setProfileLine("Could not load profile.");
    }
  }, []);

  const refreshBoard = useCallback(async () => {
    setStatus("Loading…");
    try {
      const list = await loadPublicPourScoreboard(
        mode,
        mode === "timed" ? duration : undefined,
      );
      setEntries(list);
      setStatus(
        list.length
          ? `${list.length} public entries (Perfect Pour Accuracy skill)`
          : "No public scores yet for this filter.",
      );
    } catch (err) {
      setEntries([]);
      setStatus(
        `Could not load scoreboard${err instanceof Error ? `: ${err.message}` : ""}`,
      );
    }
  }, [mode, duration]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    void refreshBoard();
  }, [refreshBoard]);

  async function onOptInChange(next: boolean) {
    try {
      await setPourScoreboardOptIn(next);
      setOptIn(next);
      await refreshBoard();
    } catch {
      setStatus("Sign in to change public scoreboard opt-in.");
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>PintPal</p>
        <h1>Pour scoreboard</h1>
        <p className={styles.sub}>
          Public Perfect Pour Accuracy standings (opt-in). Separate from ratings
          and contribution leaderboards. Never drinking volume or speed.
        </p>
      </header>

      <p className={styles.profile}>{profileLine}</p>

      <label className={styles.optIn}>
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => void onOptInChange(e.target.checked)}
        />
        Show my best on the public pour scoreboard
      </label>

      <div className={styles.filters}>
        <button
          type="button"
          className={mode === "practice" ? styles.active : undefined}
          onClick={() => setMode("practice")}
        >
          Practice
        </button>
        <button
          type="button"
          className={mode === "timed" ? styles.active : undefined}
          onClick={() => setMode("timed")}
        >
          Timed
        </button>
      </div>

      {mode === "timed" ? (
        <div className={styles.filters}>
          {TIMED_DURATIONS_SECONDS.map((sec) => (
            <button
              key={sec}
              type="button"
              className={duration === sec ? styles.active : undefined}
              onClick={() => setDuration(sec)}
            >
              {sec}s
            </button>
          ))}
        </div>
      ) : null}

      <p className={styles.status}>{status}</p>
      <ol className={styles.list}>
        {entries.map((e) => (
          <li key={e.id}>
            <strong>{e.displayName}</strong> — {e.score.toFixed(1)}
            {mode === "practice" && e.level != null ? ` · lvl ${e.level}` : ""}
            {mode === "timed"
              ? ` · ${e.durationSeconds ?? "?"}s · ${e.completedPours} pours`
              : ""}
          </li>
        ))}
      </ol>
    </div>
  );
}
