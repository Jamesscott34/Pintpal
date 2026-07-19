/**
 * servingGameScoreRepository.ts
 *
 * Purpose: Persist Serving Rush personal bests and public serving_game_scores.
 * Connects to: ServingRushScreen / scoreboard; separate from pour_game_scores.
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
  ServingGameScoreFields,
  UserFields,
} from "@/utilities/firebaseConstants";
import { loadUserDocument } from "@/features/auth/data/authRepository";

export type ServingScoreSubmission = {
  score: number;
  completedOrders: number;
  misses: number;
};

export type ServingScoreboardEntry = {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  completedOrders: number;
  misses: number;
};

function isImproved(previous: number | null | undefined, candidate: number): boolean {
  return previous == null || candidate > previous;
}

export async function submitServingScore(
  submission: ServingScoreSubmission,
): Promise<{ personalBestUpdated: boolean; publicBoardUpdated: boolean }> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const db = getFirebaseFirestore();
  const docUser = await loadUserDocument(user.uid);
  if (!docUser) throw new Error("User profile missing");

  const previous = (docUser as { servingGameBestScore?: number | null })
    .servingGameBestScore;
  const personalBestUpdated = isImproved(previous, submission.score);
  if (personalBestUpdated) {
    await setDoc(
      doc(db, Collections.users, user.uid),
      { [UserFields.servingGameBestScore]: submission.score },
      { merge: true },
    );
  }

  let publicBoardUpdated = false;
  const optIn =
    (docUser as { servingGameScoreboardOptIn?: boolean }).servingGameScoreboardOptIn ===
    true;
  if (optIn && personalBestUpdated) {
    await setDoc(
      doc(db, Collections.servingGameScores, `${user.uid}_best`),
      {
        [ServingGameScoreFields.userId]: user.uid,
        [ServingGameScoreFields.displayName]:
          docUser.name?.trim() || user.email || "Player",
        [ServingGameScoreFields.score]: submission.score,
        [ServingGameScoreFields.completedOrders]: submission.completedOrders,
        [ServingGameScoreFields.misses]: submission.misses,
        [ServingGameScoreFields.updatedAt]: Date.now(),
        [ServingGameScoreFields.isPublic]: true,
      },
      { merge: true },
    );
    publicBoardUpdated = true;
  }

  return { personalBestUpdated, publicBoardUpdated };
}

export async function setServingScoreboardOptIn(optIn: boolean): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const db = getFirebaseFirestore();
  await setDoc(
    doc(db, Collections.users, user.uid),
    { [UserFields.servingGameScoreboardOptIn]: optIn },
    { merge: true },
  );
  if (!optIn) {
    await setDoc(
      doc(db, Collections.servingGameScores, `${user.uid}_best`),
      { [ServingGameScoreFields.isPublic]: false },
      { merge: true },
    );
  }
}

export async function loadPublicServingScoreboard(): Promise<
  ServingScoreboardEntry[]
> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, Collections.servingGameScores),
    where(ServingGameScoreFields.isPublic, "==", true),
    orderBy(ServingGameScoreFields.score, "desc"),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: String(data[ServingGameScoreFields.userId] ?? ""),
      displayName: String(data[ServingGameScoreFields.displayName] ?? "Player"),
      score: Number(data[ServingGameScoreFields.score] ?? 0),
      completedOrders: Number(data[ServingGameScoreFields.completedOrders] ?? 0),
      misses: Number(data[ServingGameScoreFields.misses] ?? 0),
    };
  });
}
