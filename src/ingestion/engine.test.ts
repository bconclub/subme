import { describe, expect, it } from 'vitest';
import { processTransactions } from './engine';
import { parseSmsTransaction } from './sms-parse';
import type { Subscription } from '@/lib/types';
import type { NormalizedTransaction } from './types';

const RECV = '2026-06-13T10:00:00.000Z';

function sub(p: Partial<Subscription>): Subscription {
  return {
    id: 's1', user_id: 'u1', service_name: 'Netflix', catalog_service_id: 'netflix',
    plan_name: 'Premium', price_inr: 649, billing_cycle: 'monthly', category: 'streaming',
    status: 'active', start_date: '2026-01-15', next_renewal_date: '2026-06-15',
    notes: '', source: 'manual', created_at: '', updated_at: '', paused_at: null,
    cancelled_at: null, ...p,
  };
}

function sms(body: string, sender = 'BANK'): NormalizedTransaction {
  const tx = parseSmsTransaction(body, RECV, sender);
  if (!tx) throw new Error(`SMS did not parse: ${body}`);
  return tx;
}

const ctx = (subs: Subscription[] = [], known: string[] = []) => ({
  subscriptions: subs,
  knownKeys: new Set(known),
});

describe('processTransactions', () => {
  it('detects a brand-new subscription from SMS', () => {
    const r = processTransactions(
      [sms('INR 119.00 spent at SPOTIFY on 14-Jun-26')],
      ctx(),
    );
    expect(r.detections).toHaveLength(1);
    expect(r.detections[0].service_slug).toBe('spotify');
    expect(r.detections[0].amount_inr).toBe(119);
    expect(r.detections[0].billing_cycle).toBe('monthly');
    expect(r.detections[0].suggested_plan_name).toBe('Individual');
    expect(r.renewals).toHaveLength(0);
  });

  it('classifies a charge for a tracked sub as a renewal, not a new detection', () => {
    const r = processTransactions(
      [sms('INR 649.00 spent on Card xx1234 at NETFLIX.COM on 15-Jun-26')],
      ctx([sub({})]),
    );
    expect(r.renewals).toHaveLength(1);
    expect(r.renewals[0].subscription_id).toBe('s1');
    expect(r.renewals[0].amount_inr).toBe(649);
    expect(r.detections).toHaveLength(0);
  });

  it('dedupes repeated charges within one run', () => {
    const r = processTransactions(
      [
        sms('Rs 1999 debited towards OPENAI on 20-06-2026'),
        sms('Rs 1999 debited towards OPENAI on 20-05-2026'),
      ],
      ctx(),
    );
    expect(r.detections).toHaveLength(1);
    // newest charge wins
    expect(r.detections[0].first_seen_on).toBe('2026-06-20');
  });

  it('never re-surfaces a known (dismissed/pending) detection', () => {
    const first = processTransactions(
      [sms('Rs 119 spent at SPOTIFY on 14-Jun-26')],
      ctx(),
    );
    const key = first.detections[0].key;
    const second = processTransactions(
      [sms('Rs 119 spent at SPOTIFY on 14-Jul-26')],
      ctx([], [key]),
    );
    expect(second.detections).toHaveLength(0);
  });

  it('ignores transactions with no catalog match', () => {
    const r = processTransactions(
      [sms('Rs 250 spent at LOCAL KIRANA STORE on 12-Jun-26')],
      ctx(),
    );
    expect(r.detections).toHaveLength(0);
    expect(r.ignored).toBe(1);
  });

  it('processes a mixed batch: renewal + new + noise', () => {
    const r = processTransactions(
      [
        sms('INR 649 spent at NETFLIX.COM on 15-Jun-26'),
        sms('Rs 399 debited towards SWIGGY ONE membership on 01-Jul-26'),
        sms('Rs 80 spent at AUTO RICKSHAW on 10-Jun-26'),
      ],
      ctx([sub({})]),
    );
    expect(r.renewals).toHaveLength(1);
    expect(r.detections).toHaveLength(1);
    expect(r.detections[0].service_slug).toBe('swiggy-one');
    expect(r.ignored).toBe(1);
    expect(r.processed).toBe(3);
  });
});
