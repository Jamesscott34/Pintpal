/**
 * drinkEntryRepository.ts
 *
 * Purpose: Create/list/rate drink entries; suggest similar beers/mixes.
 */

import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseFirestore } from "@/utilities/firebase";
import {
  Collections,
  DrinkEntryFields,
  DrinkRatingFields,
} from "@/utilities/firebaseConstants";
import { loadUserDocument } from "@/features/auth/data/authRepository";
import type { DrinkEntry } from "../types";

function normalizeTags(baseBeer: string, mixins: string, title: string): string[] {
  const raw = `${baseBeer} ${mixins} ${title}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
  return [...new Set(raw)].slice(0, 16);
}

function mapEntry(id: string, data: DocumentData): DrinkEntry {
  const tags = Array.isArray(data[DrinkEntryFields.tags])
    ? (data[DrinkEntryFields.tags] as unknown[]).filter(
        (t): t is string => typeof t === "string",
      )
    : [];
  return {
    id,
    userId: typeof data[DrinkEntryFields.userId] === "string" ? data[DrinkEntryFields.userId] : "",
    displayName:
      typeof data[DrinkEntryFields.displayName] === "string"
        ? data[DrinkEntryFields.displayName]
        : "Member",
    title: typeof data[DrinkEntryFields.title] === "string" ? data[DrinkEntryFields.title] : "",
    baseBeer:
      typeof data[DrinkEntryFields.baseBeer] === "string"
        ? data[DrinkEntryFields.baseBeer]
        : "",
    mixins:
      typeof data[DrinkEntryFields.mixins] === "string"
        ? data[DrinkEntryFields.mixins]
        : "",
    tags,
    notes: typeof data[DrinkEntryFields.notes] === "string" ? data[DrinkEntryFields.notes] : "",
    createdAtMs:
      typeof data[DrinkEntryFields.createdAt] === "number"
        ? data[DrinkEntryFields.createdAt]
        : 0,
    ratingSum:
      typeof data[DrinkEntryFields.ratingSum] === "number"
        ? data[DrinkEntryFields.ratingSum]
        : 0,
    ratingCount:
      typeof data[DrinkEntryFields.ratingCount] === "number"
        ? data[DrinkEntryFields.ratingCount]
        : 0,
    averageRating:
      typeof data[DrinkEntryFields.averageRating] === "number"
        ? data[DrinkEntryFields.averageRating]
        : 0,
  };
}

export async function listRecentDrinks(max = 50): Promise<DrinkEntry[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, Collections.drinkEntries),
    orderBy(DrinkEntryFields.createdAt, "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapEntry(d.id, d.data()));
}

export async function listTopRatedDrinks(max = 20): Promise<DrinkEntry[]> {
  const all = await listRecentDrinks(80);
  return [...all]
    .filter((d) => d.ratingCount > 0)
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.ratingCount - a.ratingCount;
    })
    .slice(0, max);
}

export async function createDrinkEntry(input: {
  title: string;
  baseBeer: string;
  mixins: string;
  notes: string;
}): Promise<DrinkEntry> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const profile = await loadUserDocument(user.uid);
  if (!profile) throw new Error("User profile missing");

  const title = input.title.trim();
  const baseBeer = input.baseBeer.trim() || title.split(/\s+/)[0] || "Beer";
  if (!title) throw new Error("Enter a drink name (e.g. Heineken with lemon).");

  const tags = normalizeTags(baseBeer, input.mixins, title);
  const db = getFirebaseFirestore();
  const ref = doc(collection(db, Collections.drinkEntries));
  const createdAt = Date.now();
  const payload = {
    [DrinkEntryFields.userId]: user.uid,
    [DrinkEntryFields.displayName]: profile.name || profile.email || "Member",
    [DrinkEntryFields.title]: title,
    [DrinkEntryFields.baseBeer]: baseBeer,
    [DrinkEntryFields.mixins]: input.mixins.trim(),
    [DrinkEntryFields.tags]: tags,
    [DrinkEntryFields.notes]: input.notes.trim(),
    [DrinkEntryFields.createdAt]: createdAt,
    [DrinkEntryFields.ratingSum]: 0,
    [DrinkEntryFields.ratingCount]: 0,
    [DrinkEntryFields.averageRating]: 0,
  };
  await setDoc(ref, payload);
  return mapEntry(ref.id, payload);
}

export async function rateDrink(drinkId: string, score: number): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const clamped = Math.round(Math.min(10, Math.max(1, score)));

  const db = getFirebaseFirestore();
  const drinkRef = doc(db, Collections.drinkEntries, drinkId);
  const ratingRef = doc(drinkRef, "ratings", user.uid);

  await runTransaction(db, async (tx) => {
    const drinkSnap = await tx.get(drinkRef);
    if (!drinkSnap.exists()) throw new Error("Drink not found");
    const data = drinkSnap.data();
    const ratingSnap = await tx.get(ratingRef);
    const oldSum =
      typeof data[DrinkEntryFields.ratingSum] === "number"
        ? data[DrinkEntryFields.ratingSum]
        : 0;
    const oldCount =
      typeof data[DrinkEntryFields.ratingCount] === "number"
        ? data[DrinkEntryFields.ratingCount]
        : 0;

    let newSum = oldSum;
    let newCount = oldCount;
    if (ratingSnap.exists()) {
      const prev =
        typeof ratingSnap.data()[DrinkRatingFields.score] === "number"
          ? ratingSnap.data()[DrinkRatingFields.score]
          : 0;
      newSum = oldSum - prev + clamped;
    } else {
      newSum = oldSum + clamped;
      newCount = oldCount + 1;
    }
    const average = newCount > 0 ? newSum / newCount : 0;
    tx.set(ratingRef, {
      [DrinkRatingFields.score]: clamped,
      [DrinkRatingFields.createdAt]: Date.now(),
    });
    tx.update(drinkRef, {
      [DrinkEntryFields.ratingSum]: newSum,
      [DrinkEntryFields.ratingCount]: newCount,
      [DrinkEntryFields.averageRating]: average,
    });
  });
}

/** Suggest similar drinks by shared base beer / overlapping tags. */
export function suggestSimilar(
  entry: DrinkEntry,
  catalog: DrinkEntry[],
  max = 5,
): DrinkEntry[] {
  const base = entry.baseBeer.trim().toLowerCase();
  const tagSet = new Set(entry.tags.map((t) => t.toLowerCase()));
  const scored = catalog
    .filter((d) => d.id !== entry.id)
    .map((d) => {
      let score = 0;
      if (base && d.baseBeer.trim().toLowerCase() === base) score += 5;
      for (const t of d.tags) {
        if (tagSet.has(t.toLowerCase())) score += 1;
      }
      if (
        base &&
        d.title.toLowerCase().includes(base) &&
        d.baseBeer.trim().toLowerCase() !== base
      ) {
        score += 2;
      }
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.d.averageRating - a.d.averageRating;
    });
  return scored.slice(0, max).map((x) => x.d);
}
