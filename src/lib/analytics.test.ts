import { describe, expect, it } from 'vitest';
import {
  activeCount,
  annualProjection,
  categoryBreakdown,
  lifetimeSpend,
  monthlyBurn,
  monthlyEquivalent,
  renewalsForMonth,
  totalDueInMonth,
  twelveMonthSpend,
  upcomingRenewals,
} from './analytics';
import type { RenewalLogEntry, Subscription } from './types';

const NOW = Date.UTC(2026, 5, 11, 19, 0, 0); // 2026-06-12 IST

function sub(partial: Partial<Subscription>): Subscription {
  return {
    id: 'id-' + Math.random().toString(36).slice(2),
    user_id: 'u1',
    service_name: 'Netflix',
    catalog_service_id: 'netflix',
    plan_name: 'Premium',
    price_inr: 649,
    billing_cycle: 'monthly',
    category: 'streaming',
    status: 'active',
    start_date: '2026-01-15',
    next_renewal_date: '2026-06-15',
    notes: '',
    source: 'manual',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    paused_at: null,
    cancelled_at: null,
    ...partial,
  };
}

describe('monthlyEquivalent', () => {
  it('normalizes all cycles to monthly', () => {
    expect(monthlyEquivalent(649, 'monthly')).toBe(649);
    expect(monthlyEquivalent(300, 'quarterly')).toBe(100);
    expect(monthlyEquivalent(1200, 'yearly')).toBe(100);
    expect(monthlyEquivalent(120, 'weekly')).toBe(520);
  });
});

describe('monthlyBurn / annualProjection / activeCount', () => {
  const subs = [
    sub({ price_inr: 649, billing_cycle: 'monthly' }),
    sub({ price_inr: 1499, billing_cycle: 'yearly', service_name: 'Prime' }),
    sub({ price_inr: 399, billing_cycle: 'quarterly', service_name: 'Swiggy One' }),
    sub({ status: 'paused', price_inr: 9999, service_name: 'Paused thing' }),
    sub({ status: 'cancelled', price_inr: 9999, service_name: 'Dead thing' }),
  ];

  it('ignores paused and cancelled', () => {
    expect(activeCount(subs)).toBe(3);
    expect(monthlyBurn(subs)).toBe(649 + 125 + 133);
    expect(annualProjection(subs)).toBe(649 * 12 + 1499 + 399 * 4);
  });

  it('is zero for empty list', () => {
    expect(monthlyBurn([])).toBe(0);
    expect(annualProjection([])).toBe(0);
  });
});

describe('categoryBreakdown', () => {
  it('aggregates by category, sorted desc, shares sum to 1', () => {
    const subs = [
      sub({ category: 'streaming', price_inr: 600 }),
      sub({ category: 'streaming', price_inr: 400, service_name: 'Hotstar' }),
      sub({ category: 'ai', price_inr: 1000, service_name: 'Claude' }),
    ];
    const slices = categoryBreakdown(subs);
    expect(slices).toHaveLength(2);
    expect(slices[0].category).toBe('streaming');
    expect(slices[0].monthly_inr).toBe(1000);
    expect(slices[0].share).toBeCloseTo(0.5);
    expect(slices.reduce((a, s) => a + s.share, 0)).toBeCloseTo(1);
  });

  it('returns empty for no active subs', () => {
    expect(categoryBreakdown([sub({ status: 'cancelled' })])).toEqual([]);
  });
});

describe('upcomingRenewals', () => {
  it('sorts by days away and limits', () => {
    const subs = [
      sub({ next_renewal_date: '2026-06-20', service_name: 'B' }),
      sub({ next_renewal_date: '2026-06-13', service_name: 'A' }),
      sub({ next_renewal_date: '2026-07-01', service_name: 'C' }),
    ];
    const ups = upcomingRenewals(subs, 2, NOW);
    expect(ups.map((u) => u.subscription.service_name)).toEqual(['A', 'B']);
    expect(ups[0].days_away).toBe(1);
  });
});

describe('lifetimeSpend', () => {
  it('prefers the renewal log when present', () => {
    const s = sub({});
    const log: RenewalLogEntry[] = [
      { id: 'r1', subscription_id: s.id, renewed_on: '2026-05-15', amount_inr: 649, created_at: '' },
      { id: 'r2', subscription_id: s.id, renewed_on: '2026-06-15', amount_inr: 699, created_at: '' },
    ];
    expect(lifetimeSpend(s, log, NOW)).toBe(1348);
  });

  it('derives from completed cycles without a log', () => {
    // started 2026-01-15, today 2026-06-12 → charges on Jan,Feb,Mar,Apr,May 15 = 5
    expect(lifetimeSpend(sub({}), [], NOW)).toBe(5 * 649);
  });
});

describe('twelveMonthSpend', () => {
  it('returns exactly 12 points ending at the current month', () => {
    const points = twelveMonthSpend([], [], NOW);
    expect(points).toHaveLength(12);
    expect(points[11].month).toBe('2026-06-01');
    expect(points[0].month).toBe('2025-07-01');
  });

  it('sums logged renewals into the right month', () => {
    const log: RenewalLogEntry[] = [
      { id: 'r1', subscription_id: 's', renewed_on: '2026-05-02', amount_inr: 500, created_at: '' },
      { id: 'r2', subscription_id: 's', renewed_on: '2026-05-20', amount_inr: 250, created_at: '' },
    ];
    const points = twelveMonthSpend([], log, NOW);
    expect(points[10]).toEqual({ month: '2026-05-01', total_inr: 750 });
  });
});

describe('renewalsForMonth / totalDueInMonth', () => {
  it('places renewals on their dates', () => {
    const subs = [
      sub({ next_renewal_date: '2026-06-15' }),
      sub({ next_renewal_date: '2026-06-15', service_name: 'Spotify', price_inr: 119 }),
      sub({ next_renewal_date: '2026-07-01', service_name: 'July only' }),
    ];
    const map = renewalsForMonth(subs, 2026, 6);
    expect(map.get('2026-06-15')?.renewals).toHaveLength(2);
    expect(map.get('2026-06-15')?.total_inr).toBe(649 + 119);
    expect(totalDueInMonth(subs, 2026, 6)).toBe(649 + 119);
  });

  it('includes multiple weekly hits in one month', () => {
    const s = sub({
      billing_cycle: 'weekly',
      start_date: '2026-06-05',
      next_renewal_date: '2026-06-12',
      price_inr: 100,
    });
    const map = renewalsForMonth([s], 2026, 6);
    // Jun 12, 19, 26
    expect([...map.keys()].sort()).toEqual(['2026-06-12', '2026-06-19', '2026-06-26']);
    expect(totalDueInMonth([s], 2026, 6)).toBe(300);
  });

  it('skips paused subs', () => {
    const map = renewalsForMonth([sub({ status: 'paused' })], 2026, 6);
    expect(map.size).toBe(0);
  });
});
