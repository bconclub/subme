import type { BillingCycle } from './types';

/**
 * All renewal math runs on IST calendar dates (UTC+5:30, no DST).
 * Dates are plain `YYYY-MM-DD` strings; never construct local-timezone Date
 * objects from them on device, since the device may not be in IST.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toISODate(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export interface DateParts {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

export function parseISODate(iso: string): DateParts {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Invalid ISO date: ${iso}`);
  return { y, m, d };
}

/** Current calendar date in IST. */
export function todayIST(now: number = Date.now()): string {
  const t = new Date(now + IST_OFFSET_MS);
  return toISODate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Epoch day number of an ISO date (timezone-free). */
function epochDay(iso: string): number {
  const { y, m, d } = parseISODate(iso);
  return Date.UTC(y, m - 1, d) / 86400000;
}

/** Whole calendar days from `fromISO` to `toISO`. Positive when `toISO` is later. */
export function daysBetween(fromISO: string, toISO: string): number {
  return epochDay(toISO) - epochDay(fromISO);
}

/** Days from today (IST) until the given date. 0 = today, negative = past. */
export function daysUntil(iso: string, now: number = Date.now()): number {
  return daysBetween(todayIST(now), iso);
}

export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseISODate(iso);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return toISODate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/**
 * Month-end-safe month addition: Jan 31 + 1 month = Feb 28 (29 in leap years),
 * matching how Indian merchants bill month-anchored subscriptions.
 */
export function addMonthsClamped(iso: string, months: number): string {
  const { y, m, d } = parseISODate(iso);
  const zeroBased = m - 1 + months;
  const ny = y + Math.floor(zeroBased / 12);
  const nm = ((zeroBased % 12) + 12) % 12; // 0-11
  const nd = Math.min(d, daysInMonth(ny, nm + 1));
  return toISODate(ny, nm + 1, nd);
}

export function addCycle(iso: string, cycle: BillingCycle): string {
  switch (cycle) {
    case 'weekly':
      return addDays(iso, 7);
    case 'monthly':
      return addMonthsClamped(iso, 1);
    case 'quarterly':
      return addMonthsClamped(iso, 3);
    case 'yearly':
      return addMonthsClamped(iso, 12);
  }
}

/**
 * Next renewal strictly after `afterISO` (default: today IST), starting from
 * `anchorISO` and stepping by `cycle`. Keeps the anchor day-of-month so a
 * Jan 31 subscription renews Feb 28, then Mar 31 - not Mar 28.
 */
export function nextRenewalAfter(
  anchorISO: string,
  cycle: BillingCycle,
  afterISO?: string,
  now: number = Date.now(),
): string {
  const after = afterISO ?? todayIST(now);
  if (cycle === 'weekly') {
    let d = anchorISO;
    while (daysBetween(after, d) <= 0) d = addDays(d, 7);
    return d;
  }
  const step = cycle === 'monthly' ? 1 : cycle === 'quarterly' ? 3 : 12;
  let i = 0;
  let d = anchorISO;
  while (daysBetween(after, d) <= 0) {
    i += step;
    d = addMonthsClamped(anchorISO, i);
  }
  return d;
}

/** Number of cycle periods that fit between two dates (for lifetime spend). */
export function completedCycles(
  anchorISO: string,
  cycle: BillingCycle,
  uptoISO: string,
): number {
  if (daysBetween(anchorISO, uptoISO) < 0) return 0;
  if (cycle === 'weekly') {
    return Math.floor(daysBetween(anchorISO, uptoISO) / 7) + 1;
  }
  const step = cycle === 'monthly' ? 1 : cycle === 'quarterly' ? 3 : 12;
  let count = 0;
  let i = 0;
  while (daysBetween(addMonthsClamped(anchorISO, i), uptoISO) >= 0) {
    count += 1;
    i += step;
  }
  return count;
}

/** First day of the month containing `iso`. */
export function startOfMonth(iso: string): string {
  const { y, m } = parseISODate(iso);
  return toISODate(y, m, 1);
}

export function isSameMonth(a: string, b: string): boolean {
  const pa = parseISODate(a);
  const pb = parseISODate(b);
  return pa.y === pb.y && pa.m === pb.m;
}

/** The renewal datetime minus N days, at 09:00 IST, as a JS Date (UTC instant). */
export function alertInstantFor(
  renewalISO: string,
  daysBefore: number,
): Date {
  const fireDate = addDays(renewalISO, -daysBefore);
  const { y, m, d } = parseISODate(fireDate);
  // 09:00 IST == 03:30 UTC same day
  return new Date(Date.UTC(y, m - 1, d, 3, 30, 0));
}

export function formatDayMonth(iso: string): string {
  const { m, d } = parseISODate(iso);
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${d} ${MONTHS[m - 1]}`;
}

export function formatFullDate(iso: string): string {
  const { y } = parseISODate(iso);
  return `${formatDayMonth(iso)} ${y}`;
}
