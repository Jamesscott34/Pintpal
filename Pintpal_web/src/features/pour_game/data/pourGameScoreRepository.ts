/**
 * pourGameScoreRepository.ts
 *
 * Purpose: Persist pour-game personal bests on users/{uid} and public pour_game_scores.
 * Connects to: Practice/Timed screens, PourScoreboardScreen; Firebase Auth + Firestore.
 * Notes: Worse runs never overwrite better bests. Public board only when opt-in.
 */

import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseFirestore } from "@/utilities/firebase";
import {
  Collections,
  PourGameScoreFields,
  UserFields,
} from "@/utilities/firebaseConstants";
import { loadUserDocument } from "@/features/auth/data/authRepository";
import type { UserDocument } from "@/features/auth/types";

export type PourScoreMode = "practice" | "timed";

export type PourScoreSubmission = {
  mode: PourScoreMode;
  score: number;
  durationSeconds?: number;
  level?: number;
  completedPours?: number;
  bestSingleAccuracy?: number;
};

export type PourScoreSubmitResult = {
  personalBestUpdated: boolean;
  publicBoardUpdated: boolean;
};

export type PourScoreboardEntry = {
  id: string;
  userId: string;
  displayName: string;
  mode: PourScoreMode;
  score: number;
  durationSeconds?: number;
  level?: number;
  completedPours: number;
  bestSingleAccuracy?: number;
};

function isImproved(previous: number | null | undefined, candidate: number): boolean {
  return previous == null || candidate > previous;
}

function boardDocumentId(uid: string, submission: PourScoreSubmission): string {
  if (submission.mode === "practice") return `${uid}_practice`;
  return `${uid}_timed_${submission.durationSeconds ?? 0}`;
}

export async function submitPourScore(
  submission: PourScoreSubmission,
): Promise<PourScoreSubmitResult> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in");
  }
  const db = getFirebaseFirestore();
  const docUser = await loadUserDocument(user.uid);
  if (!docUser) {
    throw new Error("User profile missing");
  }

  let personalBestUpdated = false;
  const profileUpdates: Record<string, unknown> = {};

  if (submission.mode === "practice") {
    personalBestUpdated = isImproved(
      docUser.pourGameBestPracticeAccuracy,
      submission.score,
    );
    if (personalBestUpdated) {
      profileUpdates[UserFields.pourGameBestPracticeAccuracy] = submission.score;
    }
  } else {
    const key = String(submission.durationSeconds ?? 0);
    const previous = docUser.pourGameBestTimedAccuracySums?.[key];
    personalBestUpdated = isImproved(previous, submission.score);
    if (personalBestUpdated) {
      profileUpdates[UserFields.pourGameBestTimedAccuracySums] = {
        ...(docUser.pourGameBestTimedAccuracySums ?? {}),
        [key]: submission.score,
      };
    }
  }

  if (Object.keys(profileUpdates).length > 0) {
    await setDoc(doc(db, Collections.users, user.uid), profileUpdates, {
      merge: true,
    });
  }

  let publicBoardUpdated = false;
  if (docUser.pourGameScoreboardOptIn && personalBestUpdated) {
    const payload: Record<string, unknown> = {
      [PourGameScoreFields.userId]: user.uid,
      [PourGameScoreFields.displayName]:
        docUser.name?.trim() || user.email || "Player",
      [PourGameScoreFields.mode]: submission.mode,
      [PourGameScoreFields.score]: submission.score,
      [PourGameScoreFields.completedPours]: submission.completedPours ?? 1,
      [PourGameScoreFields.updatedAt]: Date.now(),
      [PourGameScoreFields.isPublic]: true,
    };
    if (submission.durationSeconds != null) {
      payload[PourGameScoreFields.durationSeconds] = submission.durationSeconds;
    }
    if (submission.level != null) {
      payload[PourGameScoreFields.level] = submission.level;
    }
    if (submission.bestSingleAccuracy != null) {
      payload[PourGameScoreFields.bestSingleAccuracy] =
        submission.bestSingleAccuracy;
    }
    await setDoc(
      doc(db, Collections.pourGameScores, boardDocumentId(user.uid, submission)),
      payload,
      { merge: true },
    );
    publicBoardUpdated = true;
  }

  return { personalBestUpdated, publicBoardUpdated };
}

export async function setPourScoreboardOptIn(optIn: boolean): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const db = getFirebaseFirestore();
  await setDoc(
    doc(db, Collections.users, user.uid),
    { [UserFields.pourGameScoreboardOptIn]: optIn },
    { merge: true },
  );
  if (!optIn) {
    const snap = await getDocs(
      query(
        collection(db, Collections.pourGameScores),
        where(PourGameScoreFields.userId, "==", user.uid),
      ),
    );
    await Promise.all(
      snap.docs.map((d) =>
        setDoc(d.ref, { [PourGameScoreFields.isPublic]: false }, { merge: true }),
      ),
    );
  }
}

export async function loadPublicPourScoreboard(
  mode: PourScoreMode,
  durationSeconds?: number,
): Promise<PourScoreboardEntry[]> {
  const db = getFirebaseFirestore();
  const constraints = [
    where(PourGameScoreFields.isPublic, "==", true),
    where(PourGameScoreFields.mode, "==", mode),
  ];
  // Note: composite indexes may be required in Firebase console for mode+score(+duration).
  let q = query(
    collection(db, Collections.pourGameScores),
    ...constraints,
    orderBy(PourGameScoreFields.score, "desc"),
    limit(50),
  );
  if (mode === "timed" && durationSeconds != null) {
    q = query(
      collection(db, Collections.pourGameScores),
      where(PourGameScoreFields.isPublic, "==", true),
      where(PourGameScoreFields.mode, "==", mode),
      where(PourGameScoreFields.durationSeconds, "==", durationSeconds),
      orderBy(PourGameScoreFields.score, "desc"),
      limit(50),
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: String(data[PourGameScoreFields.userId] ?? ""),
      displayName: String(data[PourGameScoreFields.displayName] ?? "Player"),
      mode,
      score: Number(data[PourGameScoreFields.score] ?? 0),
      durationSeconds:
        data[PourGameScoreFields.durationSeconds] != null
          ? Number(data[PourGameScoreFields.durationSeconds])
          : undefined,
      level:
        data[PourGameScoreFields.level] != null
          ? Number(data[PourGameScoreFields.level])
          : undefined,
      completedPours: Number(data[PourGameScoreFields.completedPours] ?? 0),
      bestSingleAccuracy:
        data[PourGameScoreFields.bestSingleAccuracy] != null
          ? Number(data[PourGameScoreFields.bestSingleAccuracy])
          : undefined,
    };
  });
}

export async function loadPourProfile(): Promise<UserDocument | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return loadUserDocument(user.uid);
}
