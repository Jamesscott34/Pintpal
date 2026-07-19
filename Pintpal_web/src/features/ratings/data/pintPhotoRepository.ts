/**
 * pintPhotoRepository.ts
 *
 * Purpose: Upload, list, rate Best Pints photos; daily/weekly winners + votes.
 * Connects to: Firestore pint_photos, contest_weeks, contest_days + Storage uploads.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage } from "@/utilities/firebase";
import {
  Collections,
  ContestDayFields,
  ContestVoteFields,
  ContestWeekFields,
  PintPhotoFields,
  PintPhotoRatingFields,
  UserFields,
} from "@/utilities/firebaseConstants";
import { loadUserDocument } from "@/features/auth/data/authRepository";
import {
  canUploadPhoto,
  isSubscriptionPaid,
  photoUploadsUsedToday,
} from "@/utilities/permissions";
import {
  dayKeyFromDate,
  previousWeekKey,
  weekKeyFromDate,
  yesterdayDayKey,
} from "./contestKeys";
import type { ContestDay, ContestWeek, PintPhoto } from "../types";

function todayUtc(): string {
  return dayKeyFromDate();
}

function mapPhoto(id: string, data: DocumentData): PintPhoto {
  return {
    id,
    userId: typeof data[PintPhotoFields.userId] === "string" ? data[PintPhotoFields.userId] : "",
    displayName:
      typeof data[PintPhotoFields.displayName] === "string"
        ? data[PintPhotoFields.displayName]
        : "Member",
    imageUrl:
      typeof data[PintPhotoFields.imageUrl] === "string"
        ? data[PintPhotoFields.imageUrl]
        : "",
    storagePath:
      typeof data[PintPhotoFields.storagePath] === "string"
        ? data[PintPhotoFields.storagePath]
        : "",
    createdAtMs:
      typeof data[PintPhotoFields.createdAt] === "number"
        ? data[PintPhotoFields.createdAt]
        : 0,
    dayKey:
      typeof data[PintPhotoFields.dayKey] === "string"
        ? data[PintPhotoFields.dayKey]
        : "",
    weekKey:
      typeof data[PintPhotoFields.weekKey] === "string"
        ? data[PintPhotoFields.weekKey]
        : "",
    ratingSum:
      typeof data[PintPhotoFields.ratingSum] === "number"
        ? data[PintPhotoFields.ratingSum]
        : 0,
    ratingCount:
      typeof data[PintPhotoFields.ratingCount] === "number"
        ? data[PintPhotoFields.ratingCount]
        : 0,
    averageRating:
      typeof data[PintPhotoFields.averageRating] === "number"
        ? data[PintPhotoFields.averageRating]
        : 0,
  };
}

function sortByAverage(photos: PintPhoto[]): PintPhoto[] {
  return [...photos].sort((a, b) => {
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating;
    }
    return b.ratingCount - a.ratingCount;
  });
}

export async function listRecentPhotos(max = 40): Promise<PintPhoto[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, Collections.pintPhotos),
    orderBy(PintPhotoFields.createdAt, "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapPhoto(d.id, d.data()));
}

export async function listPhotosForDay(dayKey: string): Promise<PintPhoto[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, Collections.pintPhotos),
    where(PintPhotoFields.dayKey, "==", dayKey),
    limit(100),
  );
  const snap = await getDocs(q);
  return sortByAverage(snap.docs.map((d) => mapPhoto(d.id, d.data())));
}

export async function listPhotosForWeek(weekKey: string): Promise<PintPhoto[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, Collections.pintPhotos),
    where(PintPhotoFields.weekKey, "==", weekKey),
    limit(100),
  );
  const snap = await getDocs(q);
  return sortByAverage(snap.docs.map((d) => mapPhoto(d.id, d.data())));
}

export async function uploadPintPhoto(file: File): Promise<PintPhoto> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const profile = await loadUserDocument(user.uid);
  if (!profile) throw new Error("User profile missing");
  if (!canUploadPhoto(profile)) {
    throw new Error("Photo upload limit reached for today (free plan).");
  }

  const dayKey = todayUtc();
  const weekKey = weekKeyFromDate();
  const storagePath = `users/${user.uid}/uploads/pint_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const storageRef = ref(getFirebaseStorage(), storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type || "image/jpeg" });
  const imageUrl = await getDownloadURL(storageRef);

  const db = getFirebaseFirestore();
  const photoRef = doc(collection(db, Collections.pintPhotos));
  const createdAt = Date.now();
  const payload = {
    [PintPhotoFields.userId]: user.uid,
    [PintPhotoFields.displayName]: profile.name || profile.email || "Member",
    [PintPhotoFields.imageUrl]: imageUrl,
    [PintPhotoFields.storagePath]: storagePath,
    [PintPhotoFields.createdAt]: createdAt,
    [PintPhotoFields.dayKey]: dayKey,
    [PintPhotoFields.weekKey]: weekKey,
    [PintPhotoFields.ratingSum]: 0,
    [PintPhotoFields.ratingCount]: 0,
    [PintPhotoFields.averageRating]: 0,
  };
  await setDoc(photoRef, payload);

  // Free-tier quota counter on users/{uid}.
  if (!isSubscriptionPaid(profile)) {
    const used = photoUploadsUsedToday(profile);
    await setDoc(
      doc(db, Collections.users, user.uid),
      {
        [UserFields.photoUploadsToday]: used + 1,
        [UserFields.photoUploadDate]: dayKey,
      },
      { merge: true },
    );
  }

  return mapPhoto(photoRef.id, payload);
}

export async function ratePhoto(photoId: string, score: number): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const clamped = Math.round(Math.min(10, Math.max(1, score)));

  const db = getFirebaseFirestore();
  const photoRef = doc(db, Collections.pintPhotos, photoId);
  const ratingRef = doc(photoRef, "ratings", user.uid);

  await runTransaction(db, async (tx) => {
    const photoSnap = await tx.get(photoRef);
    if (!photoSnap.exists()) throw new Error("Photo not found");
    const data = photoSnap.data();
    const ratingSnap = await tx.get(ratingRef);
    const oldSum =
      typeof data[PintPhotoFields.ratingSum] === "number"
        ? data[PintPhotoFields.ratingSum]
        : 0;
    const oldCount =
      typeof data[PintPhotoFields.ratingCount] === "number"
        ? data[PintPhotoFields.ratingCount]
        : 0;

    let newSum = oldSum;
    let newCount = oldCount;
    if (ratingSnap.exists()) {
      const prev =
        typeof ratingSnap.data()[PintPhotoRatingFields.score] === "number"
          ? ratingSnap.data()[PintPhotoRatingFields.score]
          : 0;
      newSum = oldSum - prev + clamped;
    } else {
      newSum = oldSum + clamped;
      newCount = oldCount + 1;
    }
    const average = newCount > 0 ? newSum / newCount : 0;
    tx.set(ratingRef, {
      [PintPhotoRatingFields.score]: clamped,
      [PintPhotoRatingFields.createdAt]: Date.now(),
    });
    tx.update(photoRef, {
      [PintPhotoFields.ratingSum]: newSum,
      [PintPhotoFields.ratingCount]: newCount,
      [PintPhotoFields.averageRating]: average,
    });
  });
}

export async function ensureDailyWinner(dayKey: string): Promise<ContestDay | null> {
  const ranked = await listPhotosForDay(dayKey);
  const top = ranked.find((p) => p.ratingCount > 0) ?? ranked[0];
  if (!top) return null;

  const db = getFirebaseFirestore();
  const dayRef = doc(db, Collections.contestDays, dayKey);
  const payload = {
    [ContestDayFields.winnerId]: top.id,
    [ContestDayFields.averageRating]: top.averageRating,
    [ContestDayFields.displayName]: top.displayName,
    [ContestDayFields.imageUrl]: top.imageUrl,
    [ContestDayFields.updatedAt]: Date.now(),
  };
  await setDoc(dayRef, payload, { merge: true });
  return {
    dayKey,
    winnerId: top.id,
    averageRating: top.averageRating,
    displayName: top.displayName,
    imageUrl: top.imageUrl,
  };
}

export async function loadDailyWinner(dayKey: string): Promise<ContestDay | null> {
  const db = getFirebaseFirestore();
  const snap = await getDoc(doc(db, Collections.contestDays, dayKey));
  if (!snap.exists()) return ensureDailyWinner(dayKey);
  const data = snap.data();
  return {
    dayKey,
    winnerId: String(data[ContestDayFields.winnerId] ?? ""),
    averageRating:
      typeof data[ContestDayFields.averageRating] === "number"
        ? data[ContestDayFields.averageRating]
        : 0,
    displayName: String(data[ContestDayFields.displayName] ?? ""),
    imageUrl: String(data[ContestDayFields.imageUrl] ?? ""),
  };
}

export async function ensureWeeklyFinalists(
  weekKey: string,
): Promise<ContestWeek> {
  const db = getFirebaseFirestore();
  const weekRef = doc(db, Collections.contestWeeks, weekKey);
  const existing = await getDoc(weekRef);
  if (existing.exists()) {
    const data = existing.data();
    const ids = Array.isArray(data[ContestWeekFields.finalistIds])
      ? (data[ContestWeekFields.finalistIds] as string[]).slice(0, 3)
      : [];
    return {
      weekKey,
      status: (data[ContestWeekFields.status] as ContestWeek["status"]) || "voting",
      finalistIds: ids,
      winnerId:
        typeof data[ContestWeekFields.winnerId] === "string"
          ? data[ContestWeekFields.winnerId]
          : null,
    };
  }

  const ranked = await listPhotosForWeek(weekKey);
  const finalistIds = ranked
    .filter((p) => p.ratingCount > 0)
    .slice(0, 3)
    .map((p) => p.id);
  // If no ratings yet, still take top by presence.
  const ids =
    finalistIds.length > 0
      ? finalistIds
      : ranked.slice(0, 3).map((p) => p.id);

  const payload = {
    [ContestWeekFields.status]: "voting",
    [ContestWeekFields.finalistIds]: ids,
    [ContestWeekFields.winnerId]: null,
    [ContestWeekFields.updatedAt]: Date.now(),
  };
  await setDoc(weekRef, payload);
  return {
    weekKey,
    status: "voting",
    finalistIds: ids,
    winnerId: null,
  };
}

export async function loadPhotosByIds(ids: string[]): Promise<PintPhoto[]> {
  if (ids.length === 0) return [];
  const db = getFirebaseFirestore();
  const out: PintPhoto[] = [];
  for (const id of ids) {
    const snap = await getDoc(doc(db, Collections.pintPhotos, id));
    if (snap.exists()) out.push(mapPhoto(snap.id, snap.data()));
  }
  return out;
}

export async function voteWeeklyWinner(
  weekKey: string,
  photoId: string,
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const week = await ensureWeeklyFinalists(weekKey);
  if (!week.finalistIds.includes(photoId)) {
    throw new Error("That photo is not in this week's top 3.");
  }

  const db = getFirebaseFirestore();
  const voteRef = doc(db, Collections.contestWeeks, weekKey, "votes", user.uid);
  await setDoc(voteRef, {
    [ContestVoteFields.photoId]: photoId,
    [ContestVoteFields.createdAt]: Date.now(),
  });

  // Tally votes and set winner.
  const votesSnap = await getDocs(
    collection(db, Collections.contestWeeks, weekKey, "votes"),
  );
  const tallies = new Map<string, number>();
  for (const v of votesSnap.docs) {
    const pid = v.data()[ContestVoteFields.photoId];
    if (typeof pid === "string") {
      tallies.set(pid, (tallies.get(pid) ?? 0) + 1);
    }
  }
  let winnerId: string | null = null;
  let best = -1;
  for (const id of week.finalistIds) {
    const n = tallies.get(id) ?? 0;
    if (n > best) {
      best = n;
      winnerId = id;
    }
  }
  if (winnerId) {
    await setDoc(
      doc(db, Collections.contestWeeks, weekKey),
      {
        [ContestWeekFields.winnerId]: winnerId,
        [ContestWeekFields.status]: "voting",
        [ContestWeekFields.updatedAt]: Date.now(),
      },
      { merge: true },
    );
  }
}

export async function loadContestSnapshot(): Promise<{
  recent: PintPhoto[];
  todayLeader: ContestDay | null;
  yesterdayWinner: ContestDay | null;
  thisWeekTop3: PintPhoto[];
  lastWeek: ContestWeek;
  lastWeekFinalists: PintPhoto[];
  currentWeekKey: string;
  previousWeekKey: string;
}> {
  const currentWeek = weekKeyFromDate();
  const prevWeek = previousWeekKey();
  const today = dayKeyFromDate();
  const yesterday = yesterdayDayKey();

  const [recent, thisWeek, todayLeader, yesterdayWinner, lastWeek] =
    await Promise.all([
      listRecentPhotos(),
      listPhotosForWeek(currentWeek),
      ensureDailyWinner(today),
      loadDailyWinner(yesterday),
      ensureWeeklyFinalists(prevWeek),
    ]);

  const lastWeekFinalists = await loadPhotosByIds(lastWeek.finalistIds);

  return {
    recent,
    todayLeader,
    yesterdayWinner,
    thisWeekTop3: thisWeek.filter((p) => p.ratingCount > 0).slice(0, 3),
    lastWeek,
    lastWeekFinalists,
    currentWeekKey: currentWeek,
    previousWeekKey: prevWeek,
  };
}
