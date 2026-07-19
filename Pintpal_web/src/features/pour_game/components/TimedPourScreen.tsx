/**
 * TimedPourScreen.tsx
 *
 * Purpose: Timed mode — choose 30/60/90/120s, complete as many two-part pours as possible.
 * Connects to: useTwoPartPour, timedMode scoring; PourGameHub.
 * Notes: Primary score = sum of Perfect Pour Accuracies. Clock at 0 locks input instantly.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { displayLevels } from "@/features/games_common/advancePour";
import type { PourScore } from "@/features/games_common/types";
import { useTwoPartPour } from "../hooks/useTwoPartPour";
import { PRACTICE_LEVEL_1 } from "../practiceDifficulty";
import {
  createEmptyTimedSummary,
  recordTimedPour,
  TIMED_DURATIONS_SECONDS,
  type TimedDurationSeconds,
  type TimedRunSummary,
} from "../timedMode";
import { submitPourScore } from "../data/pourGameScoreRepository";
import styles from "./TimedPourScreen.module.css";

type RunStatus = "setup" | "running" | "finished";

export function TimedPourScreen() {
  const [duration, setDuration] = useState<TimedDurationSeconds>(60);
  const [status, setStatus] = useState<RunStatus>("setup");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [summary, setSummary] = useState<TimedRunSummary>(() =>
    createEmptyTimedSummary(60),
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const endAtRef = useRef<number | null>(null);
  const summaryRef = useRef(summary);
  summaryRef.current = summary;

  const inputLocked = status !== "running";

  const onComplete = useCallback((score: PourScore) => {
    if (statusRef.current !== "running") return;
    setSummary((prev) => recordTimedPour(prev, score));
  }, []);

  const {
    phase,
    state,
    config,
    lastScore,
    phaseHint,
    startPour,
    stopPour,
    reset,
  } = useTwoPartPour({
    difficulty: PRACTICE_LEVEL_1,
    inputLocked,
    onComplete,
  });

  // After a completed pour during a run, auto-reset glass for the next pour.
  useEffect(() => {
    if (status === "running" && phase === "complete") {
      const t = window.setTimeout(() => reset(), 600);
      return () => window.clearTimeout(t);
    }
  }, [status, phase, reset]);

  // Countdown — locks the instant remaining hits 0.
  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      const endAt = endAtRef.current;
      if (endAt == null) return;
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        setStatus("finished");
        endAtRef.current = null;
        const finalSummary = summaryRef.current;
        void submitPourScore({
          mode: "timed",
          score: finalSummary.accuracySum,
          durationSeconds: finalSummary.durationSeconds,
          completedPours: finalSummary.completedPours,
          bestSingleAccuracy: finalSummary.bestSingleAccuracy,
        })
          .then((result) => {
            setSaveMessage(
              result.personalBestUpdated
                ? result.publicBoardUpdated
                  ? "Personal best saved to your profile and public pour scoreboard."
                  : "Personal best saved to your profile."
                : "Run recorded — did not beat your personal best.",
            );
          })
          .catch(() => {
            setSaveMessage("Sign in to save scores to your profile.");
          });
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [status]);

  function startRun() {
    setSummary(createEmptyTimedSummary(duration));
    setSecondsLeft(duration);
    setSaveMessage(null);
    endAtRef.current = Date.now() + duration * 1000;
    setStatus("running");
    reset();
  }

  function backToSetup() {
    setStatus("setup");
    endAtRef.current = null;
    reset();
  }

  const display = displayLevels(state);
  const canPour =
    status === "running" && (phase === "first_pour" || phase === "top_up");
  const targetBottom = config.targetLiquidLevel * 100;
  const targetTop =
    (config.targetLiquidLevel + config.targetHeadSize) * 100;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>PintPal</p>
        <h1>Timed pour</h1>
        <p className={styles.sub}>
          Complete as many two-part pours as you can. Score is the sum of Perfect
          Pour Accuracies — bartender skill, not drinking.
        </p>
      </header>

      {status === "setup" ? (
        <section className={styles.setup}>
          <p className={styles.setupLabel}>Choose duration</p>
          <div className={styles.durationRow} role="group" aria-label="Duration">
            {TIMED_DURATIONS_SECONDS.map((sec) => (
              <button
                key={sec}
                type="button"
                className={
                  duration === sec ? styles.durationActive : styles.durationBtn
                }
                onClick={() => setDuration(sec)}
              >
                {sec}s
              </button>
            ))}
          </div>
          <button type="button" className={styles.startBtn} onClick={startRun}>
            Start timed run
          </button>
        </section>
      ) : (
        <>
          <div className={styles.hud} aria-live="polite">
            <span className={secondsLeft <= 5 ? styles.clockUrgent : styles.clock}>
              {secondsLeft}s
            </span>
            <span>
              Pours: {summary.completedPours} · Accuracy sum:{" "}
              {summary.accuracySum}
            </span>
            <span>Best single: {summary.bestSingleAccuracy}%</span>
          </div>

          {status === "finished" ? (
            <div className={styles.finished}>
              <p className={styles.finishedTitle}>Time&apos;s up — input locked</p>
              <p>
                Completed pours: {summary.completedPours}. Accuracy sum:{" "}
                {summary.accuracySum}. Best Perfect Pour Accuracy:{" "}
                {summary.bestSingleAccuracy}%.
              </p>
              {saveMessage ? <p>{saveMessage}</p> : null}
              <button type="button" className={styles.startBtn} onClick={backToSetup}>
                New timed run
              </button>
            </div>
          ) : (
            <>
              <p className={styles.hint}>{phaseHint}</p>
              <div
                className={styles.glass}
                role="img"
                aria-label={`Liquid ${Math.round(display.liquidLevel * 100)}%`}
              >
                <div
                  className={styles.targetBand}
                  style={{
                    bottom: `${targetBottom}%`,
                    height: `${Math.max(targetTop - targetBottom, 2)}%`,
                  }}
                />
                <div
                  className={styles.liquid}
                  style={{
                    height: `${display.liquidLevel * 100}%`,
                    background: config.liquidColor,
                  }}
                />
                <div
                  className={styles.head}
                  style={{
                    bottom: `${display.liquidLevel * 100}%`,
                    height: `${display.headSize * 100}%`,
                    background: config.headColor,
                  }}
                />
                <div className={styles.rim} />
              </div>
              <button
                type="button"
                className={styles.pourButton}
                disabled={!canPour}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  startPour();
                }}
                onPointerUp={stopPour}
                onPointerCancel={stopPour}
              >
                {canPour
                  ? state.isPouring
                    ? "Pouring… release to stop"
                    : "Hold to pour"
                  : phase === "settle"
                    ? "Settling…"
                    : "Wait…"}
              </button>
              {lastScore && phase === "complete" ? (
                <p className={styles.lastPour}>{lastScore.feedbackLabel}</p>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}
