import { describe, expect, it } from 'vitest';
import {
  addCycle,
  addDays,
  addMonthsClamped,
  alertInstantFor,
  completedCycles,
  daysBetween,
  daysUntil,
  nextRenewalAfter,
  todayIST,
} from './dates';

// 2026-06-12 00:30 IST == 2026-06-11 19:00 UTC
const NOW = Date.UTC(2026, 5, 11, 19, 0, 0);

describe('todayIST', () => {
  it('rolls to next day past midnight IST while UTC is still previous day', () => {
    expect(todayIST(NOW)).toBe('2026-06-12');
  });

  it('stays on same day before midnight IST', () => {
    // 2026-06-11 23:00 IST == 17:30 UTC
    expect(todayIST(Date.UTC(2026, 5, 11, 17, 30))).toBe('2026-06-11');
  });
});

describe('addMonthsClamped', () => {
  it('clamps Jan 31 to Feb 28 (non-leap)', () => {
    expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28');
  });

  it('clamps Jan 31 to Feb 29 in a leap year', () => {
    expect(addMonthsClamped('2028-01-31', 1)).toBe('2028-02-29');
  });

  it('clamps May 31 to Jun 30', () => {
    expect(addMonthsClamped('2026-05-31', 1)).toBe('2026-06-30');
  });

  it('crosses year boundaries', () => {
    expect(addMonthsClamped('2026-11-15', 3)).toBe('2027-02-15');
  });

  it('handles negative months', () => {
    expect(addMonthsClamped('2026-03-31', -1)).toBe('2026-02-28');
  });
});

describe('addCycle', () => {
  it('weekly adds 7 days', () => {
    expect(addCycle('2026-06-12', 'weekly')).toBe('2026-06-19');
  });
  it('quarterly adds 3 months', () => {
    expect(addCycle('2026-01-31', 'quarterly')).toBe('2026-04-30');
  });
  it('yearly adds 12 months and respects Feb 29', () => {
    expect(addCycle('2028-02-29', 'yearly')).toBe('2029-02-28');
  });
});

describe('nextRenewalAfter', () => {
  it('keeps anchor day-of-month after a clamped month', () => {
    // Anchored Jan 31: Feb 28, Mar 31, Apr 30...
    expect(nextRenewalAfter('2026-01-31', 'monthly', '2026-02-28')).toBe('2026-03-31');
  });

  it('returns first renewal strictly after the given date', () => {
    expect(nextRenewalAfter('2026-01-15', 'monthly', '2026-06-12')).toBe('2026-06-15');
    expect(nextRenewalAfter('2026-01-15', 'monthly', '2026-06-15')).toBe('2026-07-15');
  });

  it('works for yearly far in the past', () => {
    expect(nextRenewalAfter('2020-03-01', 'yearly', '2026-06-12')).toBe('2027-03-01');
  });

  it('works for weekly', () => {
    expect(nextRenewalAfter('2026-06-01', 'weekly', '2026-06-12')).toBe('2026-06-15');
  });
});

describe('daysBetween / daysUntil', () => {
  it('computes signed day differences', () => {
    expect(daysBetween('2026-06-12', '2026-06-15')).toBe(3);
    expect(daysBetween('2026-06-15', '2026-06-12')).toBe(-3);
  });

  it('daysUntil uses IST today', () => {
    expect(daysUntil('2026-06-15', NOW)).toBe(3);
    expect(daysUntil('2026-06-12', NOW)).toBe(0);
  });
});

describe('completedCycles', () => {
  it('counts the initial charge', () => {
    expect(completedCycles('2026-06-01', 'monthly', '2026-06-12')).toBe(1);
  });
  it('counts monthly cycles inclusively', () => {
    expect(completedCycles('2026-01-15', 'monthly', '2026-06-12')).toBe(5);
    expect(completedCycles('2026-01-15', 'monthly', '2026-06-15')).toBe(6);
  });
  it('returns 0 before the start date', () => {
    expect(completedCycles('2026-07-01', 'monthly', '2026-06-12')).toBe(0);
  });
});

describe('alertInstantFor', () => {
  it('fires at 09:00 IST = 03:30 UTC, days_before earlier', () => {
    const d = alertInstantFor('2026-06-15', 2);
    expect(d.toISOString()).toBe('2026-06-13T03:30:00.000Z');
  });
});

describe('addDays', () => {
  it('crosses month boundaries', () => {
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
