/**
 * TimedPourScreen.tsx
 *
 * Purpose: Timed mode — choose duration; each completed pour raises heat difficulty.
 * Connects to: useTwoPartPour, timedMode scoring; PourGameHub.
 * Notes: Distinct sections: first pour → settle → top-up. Harder each completed pour.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { displayLevels } from "@/features/games_common/advancePour";
import type { PourScore } from "@/features/games_common/types";
import { useTwoPartPour } from "../hooks/useTwoPartPour";
import {
  createEmptyTimedSummary,
  recordTimedPour,
  timedDifficultyForHeat,
  TIMED_DURATIONS_SECONDS,
  type TimedDurationSeconds,
  type TimedRunSummary,
} from "../timedMode";
import { submitPourScore } from "../data/pourGameScoreRepository";
import type { PourPhase } from "../types";
import styles from "./TimedPourScreen.module.css";

type RunStatus = "setup" | "running" | "finished";

const PHASE_SECTION: Record<
  PourPhase,
  { step: number; title: string; detail: string }
> = {
  first_pour: {
    step: 1,
    title: "Section 1 · First pour",
    detail: "Fill to about two-thirds, then release.",
  },
  settle: {
    step: 2,
    title: "Section 2 · Settle",
    detail: "Head drops — wait for the top-up window.",
  },
  top_up: {
    step: 3,
    title: "Section 3 · Top-up",
    detail: "Finish the pour into the ideal head band.",
  },
  complete: {
    step: 3,
    title: "Round complete",
    detail: "Heat rises for the next pour.",
  },
};

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

  const difficulty = useMemo(
    () => timedDifficultyForHeat(summary.nextHeat),
    [summary.nextHeat],
  );

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
    difficulty,
    inputLocked,
    onComplete,
  });

  useEffect(() => {
    if (status === "running" && phase === "complete") {
      const t = window.setTimeout(() => reset(), 700);
      return () => window.clearTimeout(t);
    }
  }, [status, phase, reset]);

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
  const section = PHASE_SECTION[phase];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>PintPal</p>
        <h1>Timed pour</h1>
        <p className={styles.sub}>
          Each pour has three sections (first pour, settle, top-up). Every
          completed pour raises the heat — faster pours and tighter targets.
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
            <span className={styles.heat}>{difficulty.label}</span>
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
              <div className={styles.phaseRail} aria-label="Pour sections">
                {([1, 2, 3] as const).map((step) => (
                  <div
                    key={step}
                    className={
                      section.step === step
                        ? styles.phaseStepActive
                        : section.step > step
                          ? styles.phaseStepDone
                          : styles.phaseStep
                    }
                  >
                    {step === 1
                      ? "First pour"
                      : step === 2
                        ? "Settle"
                        : "Top-up"}
                  </div>
                ))}
              </div>
              <div className={styles.sectionCard}>
                <p className={styles.sectionTitle}>{section.title}</p>
                <p className={styles.sectionDetail}>{section.detail}</p>
                <p className={styles.hint}>{phaseHint}</p>
              </div>
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
