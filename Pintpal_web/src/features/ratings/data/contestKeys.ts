/**
 * contestKeys.ts
 *
 * Purpose: UTC day / ISO week keys for Best Pints contests.
 */

/** yyyy-MM-dd in UTC. */
export function dayKeyFromDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Yesterday UTC day key. */
export function yesterdayDayKey(date = new Date()): string {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() - 1);
  return dayKeyFromDate(d);
}

/**
 * ISO week key: yyyy-Www (UTC-based Monday start).
 */
export function weekKeyFromDate(date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  // Thursday in current week decides the year.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Previous ISO week key. */
export function previousWeekKey(date = new Date()): string {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() - 7);
  return weekKeyFromDate(d);
}
