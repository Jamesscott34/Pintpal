/**
 * types.ts — Best Pints photo contest
 *
 * Purpose: Shared types for pint photo uploads, ratings, and winners.
 */

export type PintPhoto = {
  id: string;
  userId: string;
  displayName: string;
  imageUrl: string;
  storagePath: string;
  createdAtMs: number;
  dayKey: string;
  weekKey: string;
  ratingSum: number;
  ratingCount: number;
  averageRating: number;
};

export type ContestWeek = {
  weekKey: string;
  status: "open" | "finalists" | "voting" | "closed";
  finalistIds: string[];
  winnerId: string | null;
};

export type ContestDay = {
  dayKey: string;
  winnerId: string;
  averageRating: number;
  displayName: string;
  imageUrl: string;
};
