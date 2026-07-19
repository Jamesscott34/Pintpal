/**
 * types.ts — drink / beer mix ratings
 *
 * Purpose: Community drink entries (e.g. Heineken with lemon) and ratings.
 */

export type DrinkEntry = {
  id: string;
  userId: string;
  displayName: string;
  /** Full label, e.g. "Heineken with lemon". */
  title: string;
  /** Base beer/brand for similar suggestions, e.g. "Heineken". */
  baseBeer: string;
  /** Free-text mix-ins / notes, e.g. "lemon", "lime wedge". */
  mixins: string;
  /** Lowercase tags for similarity (base + mixin words). */
  tags: string[];
  notes: string;
  createdAtMs: number;
  ratingSum: number;
  ratingCount: number;
  averageRating: number;
};
