import type {
  BillingCycle,
  Category,
  RenewalLogEntry,
  Subscription,
} from './types';
import {
  addMonthsClamped,
  completedCycles,
  daysUntil,
  isSameMonth,
  nextRenewalAfter,
  parseISODate,
  startOfMonth,
  todayIST,
  toISODate,
} from './dates';

/** Cost normalized to a per-month figure, rounded to the rupee. */
export function monthlyEquivalent(price: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return Math.round((price * 52) / 12);
    case 'monthly':
      return price;
    case 'quarterly':
      return Math.round(price / 3);
    case 'yearly':
      return Math.round(price / 12);
  }
}

export function monthlyBurn(subs: Subscription[]): number {
  return subs
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + monthlyEquivalent(s.price_inr, s.billing_cycle), 0);
}

export function annualProjection(subs: Subscription[]): number {
  return subs
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => {
      switch (s.billing_cycle) {
        case 'weekly':
          return sum + s.price_inr * 52;
        case 'monthly':
          return sum + s.price_inr * 12;
        case 'quarterly':
          return sum + s.price_inr * 4;
        case 'yearly':
          return sum + s.price_inr;
      }
    }, 0);
}

export function activeCount(subs: Subscription[]): number {
  return subs.filter((s) => s.status === 'active').length;
}

export interface CategorySlice {
  category: Category;
  monthly_inr: number;
  share: number; // 0-1
}

export function categoryBreakdown(subs: Subscription[]): CategorySlice[] {
  const totals = new Map<Category, number>();
  for (const s of subs) {
    if (s.status !== 'active') continue;
    const m = monthlyEquivalent(s.price_inr, s.billing_cycle);
    totals.set(s.category, (totals.get(s.category) ?? 0) + m);
  }
  const grand = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([category, monthly_inr]) => ({
      category,
      monthly_inr,
      share: grand > 0 ? monthly_inr / grand : 0,
    }))
    .sort((a, b) => b.monthly_inr - a.monthly_inr);
}

export interface UpcomingRenewal {
  subscription: Subscription;
  renewal_date: string;
  days_away: number;
}

export function upcomingRenewals(
  subs: Subscription[],
  limit = 5,
  now: number = Date.now(),
): UpcomingRenewal[] {
  return subs
    .filter((s) => s.status === 'active')
    .map((s) => ({
      subscription: s,
      renewal_date: s.next_renewal_date,
      days_away: daysUntil(s.next_renewal_date, now),
    }))
    .sort((a, b) => a.days_away - b.days_away)
    .slice(0, limit);
}

export interface MonthSpendPoint {
  /** First day of month, ISO. */
  month: string;
  total_inr: number;
}

/**
 * Trailing 12-month spend series. Past months come from the renewal log
 * (actual charges); the current month adds renewals already passed this
 * month for subscriptions that predate logging.
 */
export function twelveMonthSpend(
  subs: Subscription[],
  renewals: RenewalLogEntry[],
  now: number = Date.now(),
): MonthSpendPoint[] {
  const today = todayIST(now);
  const thisMonth = startOfMonth(today);
  const points: MonthSpendPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const month = addMonthsClamped(thisMonth, -i);
    const fromLog = renewals
      .filter((r) => isSameMonth(r.renewed_on, month))
      .reduce((sum, r) => sum + r.amount_inr, 0);
    points.push({ month, total_inr: fromLog });
  }
  return points;
}

/**
 * Total charged since the subscription started: cycles completed up to today
 * at the current price, unless a renewal log exists (then the log wins).
 */
export function lifetimeSpend(
  sub: Subscription,
  renewals: RenewalLogEntry[],
  now: number = Date.now(),
): number {
  const logged = renewals
    .filter((r) => r.subscription_id === sub.id)
    .reduce((sum, r) => sum + r.amount_inr, 0);
  if (logged > 0) return logged;
  const upto =
    sub.status === 'cancelled' && sub.cancelled_at
      ? sub.cancelled_at.slice(0, 10)
      : todayIST(now);
  return completedCycles(sub.start_date, sub.billing_cycle, upto) * sub.price_inr;
}

export interface CalendarDay {
  date: string;
  renewals: Subscription[];
  total_inr: number;
}

/** Renewal map for a calendar month (y, m 1-12). Includes multi-cycle hits. */
export function renewalsForMonth(
  subs: Subscription[],
  y: number,
  m: number,
): Map<string, CalendarDay> {
  const monthStart = toISODate(y, m, 1);
  const map = new Map<string, CalendarDay>();
  for (const s of subs) {
    if (s.status !== 'active') continue;
    // Walk renewals from the anchor; collect any landing in this month.
    let d = s.next_renewal_date;
    // Step back is unnecessary: next_renewal_date is always >= today.
    for (let guard = 0; guard < 60; guard++) {
      const p = parseISODate(d);
      if (p.y > y || (p.y === y && p.m > m)) break;
      if (p.y === y && p.m === m) {
        const day = map.get(d) ?? { date: d, renewals: [], total_inr: 0 };
        day.renewals.push(s);
        day.total_inr += s.price_inr;
        map.set(d, day);
      }
      d = nextRenewalAfter(s.start_date, s.billing_cycle, d);
    }
  }
  void monthStart;
  return map;
}

export function totalDueInMonth(
  subs: Subscription[],
  y: number,
  m: number,
): number {
  let total = 0;
  for (const day of renewalsForMonth(subs, y, m).values()) {
    total += day.total_inr;
  }
  return total;
}
