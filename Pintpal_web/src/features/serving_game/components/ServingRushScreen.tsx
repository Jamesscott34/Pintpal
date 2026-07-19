/**
 * ServingRushScreen.tsx
 *
 * Purpose: Serving Rush — pick the correct tap, then pour accurately before the order timer.
 * Connects to: games_common PourGlass; servingGameScoreRepository.
 * Notes: Wrong tap or timeout = miss (score reduced). Never rewards drinking volume/speed.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TiltPourGlass } from "@/features/games_common/components";
import type { PourScore } from "@/features/games_common/types";
import {
  SERVING_DRINKS,
  SERVING_MISS_PENALTY,
  SERVING_ORDER_SECONDS,
  SERVING_ORDERS_PER_RUN,
  drinkById,
  randomDrinkId,
  type ServingDrinkId,
} from "../drinks";
import {
  setServingScoreboardOptIn,
  submitServingScore,
} from "../data/servingGameScoreRepository";
import { loadUserDocument } from "@/features/auth/data/authRepository";
import { getFirebaseAuth } from "@/utilities/firebase";
import styles from "./ServingRushScreen.module.css";

type Phase = "idle" | "pick_tap" | "pouring" | "finished";

export function ServingRushScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [orderIndex, setOrderIndex] = useState(0);
  const [currentDrink, setCurrentDrink] = useState<ServingDrinkId>("guinness");
  const [secondsLeft, setSecondsLeft] = useState(SERVING_ORDER_SECONDS);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [status, setStatus] = useState("Start a rush — pick the right tap, then pour.");
  const [optIn, setOptIn] = useState(false);
  const [pourKey, setPourKey] = useState(0);
  const missLock = useRef(false);

  useEffect(() => {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) return;
    void loadUserDocument(uid).then((doc) => {
      if (doc?.servingGameScoreboardOptIn) setOptIn(true);
    });
  }, []);

  const finishRun = useCallback(
    async (finalScore: number, finalCompleted: number, finalMisses: number) => {
      setPhase("finished");
      setStatus("Rush complete.");
      try {
        const result = await submitServingScore({
          score: finalScore,
          completedOrders: finalCompleted,
          misses: finalMisses,
        });
        if (result.personalBestUpdated) {
          setStatus(
            result.publicBoardUpdated
              ? "Personal best saved and shown on the Serving Rush scoreboard."
              : "Personal best saved to your profile.",
          );
        } else {
          setStatus("Run saved. Score did not beat your personal best.");
        }
      } catch (err) {
        setStatus(
          err instanceof Error ? err.message : "Could not save Serving Rush score.",
        );
      }
    },
    [],
  );

  const advanceOrFinish = useCallback(
    (
      nextScore: number,
      nextCompleted: number,
      nextMisses: number,
      nextOrder: number,
    ) => {
      if (nextOrder >= SERVING_ORDERS_PER_RUN) {
        void finishRun(nextScore, nextCompleted, nextMisses);
        return;
      }
      missLock.current = false;
      setOrderIndex(nextOrder);
      setCurrentDrink(randomDrinkId());
      setSecondsLeft(SERVING_ORDER_SECONDS);
      setPhase("pick_tap");
      setStatus("New order — select the correct tap.");
    },
    [finishRun],
  );

  const registerMiss = useCallback(
    (reason: string) => {
      if (missLock.current || phase === "finished" || phase === "idle") return;
      missLock.current = true;
      const nextMisses = misses + 1;
      const nextScore = Math.max(0, score - SERVING_MISS_PENALTY);
      setMisses(nextMisses);
      setScore(nextScore);
      setStatus(`${reason} (−${SERVING_MISS_PENALTY})`);
      advanceOrFinish(nextScore, completed, nextMisses, orderIndex + 1);
    },
    [advanceOrFinish, completed, misses, orderIndex, phase, score],
  );

  useEffect(() => {
    if (phase !== "pick_tap" && phase !== "pouring") return;
    if (secondsLeft <= 0) {
      registerMiss("Order timed out");
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, secondsLeft, registerMiss]);

  function startRun() {
    missLock.current = false;
    setScore(0);
    setMisses(0);
    setCompleted(0);
    setOrderIndex(0);
    setCurrentDrink(randomDrinkId());
    setSecondsLeft(SERVING_ORDER_SECONDS);
    setPourKey((k) => k + 1);
    setPhase("pick_tap");
    setStatus("Select the tap that matches the order.");
  }

  function onTap(id: ServingDrinkId) {
    if (phase !== "pick_tap") return;
    if (id !== currentDrink) {
      registerMiss("Wrong tap");
      return;
    }
    setPhase("pouring");
    setPourKey((k) => k + 1);
    setStatus("Correct tap — tilt the glass to pour, then level out to score.");
  }

  function onPourScore(pourScore: PourScore) {
    if (phase !== "pouring" || missLock.current) return;
    missLock.current = true;
    const gained = Math.round(pourScore.overallAccuracyPercent);
    const nextScore = score + gained;
    const nextCompleted = completed + 1;
    setScore(nextScore);
    setCompleted(nextCompleted);
    setStatus(`${pourScore.feedbackLabel} (+${gained})`);
    advanceOrFinish(nextScore, nextCompleted, misses, orderIndex + 1);
  }

  async function onToggleOptIn(checked: boolean) {
    setOptIn(checked);
    try {
      await setServingScoreboardOptIn(checked);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not update opt-in.");
    }
  }

  const drink = drinkById(currentDrink);

  return (
    <div className={styles.screen}>
      <p className={styles.brand}>PintPal</p>
      <h1 className={styles.title}>Serving Rush</h1>
      <p className={styles.lead}>
      Match the order to the right tap, then tilt the glass to pour before time
      runs out. Misses reduce your score. Bartender skill only — not drinking.
      </p>

      <div className={styles.stats}>
        <span>Score {score}</span>
        <span>
          Order {Math.min(orderIndex + 1, SERVING_ORDERS_PER_RUN)}/
          {SERVING_ORDERS_PER_RUN}
        </span>
        <span>Misses {misses}</span>
        {(phase === "pick_tap" || phase === "pouring") && (
          <span className={styles.timer}>{secondsLeft}s</span>
        )}
      </div>

      {phase !== "idle" && phase !== "finished" ? (
        <p className={styles.order}>
          Order: <strong>{drink.label}</strong>
        </p>
      ) : null}

      {(phase === "pick_tap" || phase === "pouring") && (
        <div className={styles.taps} role="group" aria-label="Drink taps">
          {SERVING_DRINKS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={styles.tap}
              disabled={phase !== "pick_tap"}
              onClick={() => onTap(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {phase === "pouring" ? (
        <div className={styles.pourWrap} key={pourKey}>
          <TiltPourGlass
            config={drink.pourConfig}
            onScore={onPourScore}
            resetKey={pourKey}
          />
        </div>
      ) : null}

      <p className={styles.status} role="status">
        {status}
      </p>

      <label className={styles.optIn}>
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => void onToggleOptIn(e.target.checked)}
        />
        Show my best on the public Serving Rush scoreboard
      </label>

      <div className={styles.actions}>
        {phase === "idle" || phase === "finished" ? (
          <button type="button" className={styles.primary} onClick={startRun}>
            {phase === "finished" ? "Play again" : "Start rush"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
