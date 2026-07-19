/**
 * ServingRushScreen.tsx
 *
 * Purpose: Serving Rush — pick the ordered pint name, then pour; difficulty ramps up.
 * Connects to: TiltPourGlass; servingGameScoreRepository; progressive heats.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TiltPourGlass } from "@/features/games_common/components";
import type { PourScore } from "@/features/games_common/types";
import {
  SERVING_MISS_PENALTY,
  SERVING_ORDERS_PER_RUN,
  drinkById,
  randomDrinkId,
  type ServingDrinkId,
} from "../drinks";
import {
  choicesForOrder,
  heatForOrder,
  pourConfigForHeat,
} from "../difficulty";
import {
  setServingScoreboardOptIn,
  submitServingScore,
} from "../data/servingGameScoreRepository";
import { loadUserDocument } from "@/features/auth/data/authRepository";
import { getFirebaseAuth } from "@/utilities/firebase";
import styles from "./ServingRushScreen.module.css";

type Phase = "idle" | "pick_pint" | "pouring" | "finished";

export function ServingRushScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [orderIndex, setOrderIndex] = useState(0);
  const [currentDrink, setCurrentDrink] = useState<ServingDrinkId>("guinness");
  const [choices, setChoices] = useState<ServingDrinkId[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(22);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [status, setStatus] = useState(
    "Start a rush — orders begin easy and get harder.",
  );
  const [optIn, setOptIn] = useState(false);
  const [pourKey, setPourKey] = useState(0);
  const missLock = useRef(false);

  const heat = useMemo(() => heatForOrder(orderIndex), [orderIndex]);
  const drink = drinkById(currentDrink);
  const pourConfig = useMemo(
    () => pourConfigForHeat(drink, orderIndex),
    [drink, orderIndex],
  );

  useEffect(() => {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) return;
    void loadUserDocument(uid).then((doc) => {
      if (doc?.servingGameScoreboardOptIn) setOptIn(true);
    });
  }, []);

  const beginOrder = useCallback((index: number, exclude?: ServingDrinkId) => {
    const id = randomDrinkId(exclude);
    missLock.current = false;
    setOrderIndex(index);
    setCurrentDrink(id);
    setChoices(choicesForOrder(id, index));
    setSecondsLeft(heatForOrder(index).seconds);
    setPhase("pick_pint");
    setStatus(
      `Order ${index + 1}: select the pint that matches the ticket (${heatForOrder(index).label}).`,
    );
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
              : "Personal best saved to your profile. Tick the scoreboard box to show it publicly.",
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
      exclude?: ServingDrinkId,
    ) => {
      if (nextOrder >= SERVING_ORDERS_PER_RUN) {
        void finishRun(nextScore, nextCompleted, nextMisses);
        return;
      }
      beginOrder(nextOrder, exclude);
    },
    [beginOrder, finishRun],
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
      advanceOrFinish(
        nextScore,
        completed,
        nextMisses,
        orderIndex + 1,
        currentDrink,
      );
    },
    [
      advanceOrFinish,
      completed,
      currentDrink,
      misses,
      orderIndex,
      phase,
      score,
    ],
  );

  useEffect(() => {
    if (phase !== "pick_pint" && phase !== "pouring") return;
    if (secondsLeft <= 0) {
      registerMiss("Order timed out");
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, secondsLeft, registerMiss]);

  function startRun() {
    setScore(0);
    setMisses(0);
    setCompleted(0);
    setPourKey((k) => k + 1);
    beginOrder(0);
  }

  function onPickPint(id: ServingDrinkId) {
    if (phase !== "pick_pint") return;
    if (id !== currentDrink) {
      registerMiss("Wrong pint");
      return;
    }
    setPhase("pouring");
    setPourKey((k) => k + 1);
    setStatus(
      `Pour the ${drink.label} — tilt, Save tilt, Tap to pour, then Stop & score.`,
    );
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
    advanceOrFinish(
      nextScore,
      nextCompleted,
      misses,
      orderIndex + 1,
      currentDrink,
    );
  }

  async function onToggleOptIn(checked: boolean) {
    setOptIn(checked);
    try {
      await setServingScoreboardOptIn(checked);
      setStatus(
        checked
          ? "Your best Serving Rush score will appear on the public scoreboard."
          : "Hidden from the public Serving Rush scoreboard.",
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not update opt-in.");
    }
  }

  return (
    <div className={styles.screen}>
      <p className={styles.brand}>PintPal</p>
      <h1 className={styles.title}>Serving Rush</h1>
      <p className={styles.lead}>
        Read the order, pick the matching pint name, then pour that glass. Starts
        easy (fewer choices, more time) and gets harder. Bartender skill only —
        not drinking.
      </p>

      <div className={styles.stats}>
        <span>Score {score}</span>
        <span>
          Order {Math.min(orderIndex + 1, SERVING_ORDERS_PER_RUN)}/
          {SERVING_ORDERS_PER_RUN}
        </span>
        <span>Misses {misses}</span>
        {(phase === "pick_pint" || phase === "pouring") && (
          <>
            <span className={styles.heat}>{heat.label}</span>
            <span className={styles.timer}>{secondsLeft}s</span>
          </>
        )}
      </div>

      {phase === "pick_pint" ? (
        <>
          <p className={styles.order}>
            Ticket: <strong>{drink.label}</strong>
          </p>
          <p className={styles.prompt}>Select the matching pint</p>
          <div className={styles.taps} role="group" aria-label="Pint names">
            {choices.map((id) => (
              <button
                key={id}
                type="button"
                className={styles.tap}
                onClick={() => onPickPint(id)}
              >
                {drinkById(id).label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {phase === "pouring" ? (
        <div className={styles.pourWrap}>
          <p className={styles.order}>
            Pouring: <strong>{drink.label}</strong>
          </p>
          <TiltPourGlass
            key={pourKey}
            config={pourConfig}
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
