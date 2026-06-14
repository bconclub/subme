import { describe, expect, it } from 'vitest';
import { matchTransaction } from './matching';
import type { Subscription } from './types';
import type { NormalizedTransaction } from '../ingestion/types';

function sub(partial: Partial<Subscription>): Subscription {
  return {
    id: 's1',
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
    created_at: '',
    updated_at: '',
    paused_at: null,
    cancelled_at: null,
    ...partial,
  };
}

function tx(partial: Partial<NormalizedTransaction>): NormalizedTransaction {
  return {
    id: 't1',
    source: 'sms',
    merchant_raw: 'NETFLIX.COM',
    amount_inr: 649,
    currency: 'INR',
    occurred_at: '2026-06-15T04:00:00Z',
    account_hint: 'XX1234',
    raw_text: 'INR 649.00 spent at NETFLIX.COM on 15-06-2026',
    ...partial,
  };
}

describe('matchTransaction', () => {
  it('matches exact amount on renewal day with high score', () => {
    const m = matchTransaction(tx({}), [sub({})]);
    expect(m?.subscription.id).toBe('s1');
    expect(m!.score).toBeGreaterThan(0.85);
    expect(m!.amount_delta).toBe(0);
    expect(m!.days_from_renewal).toBe(0);
  });

  it('tolerates small price changes within 5%', () => {
    const m = matchTransaction(tx({ amount_inr: 669 }), [sub({})]);
    expect(m).not.toBeNull();
  });

  it('matches a custom (non-catalog) subscription by name token', () => {
    const m = matchTransaction(
      tx({
        merchant_raw: 'SOCIETY GYM DUES',
        amount_inr: 1500,
        raw_text: 'Rs 1500 paid to SOCIETY GYM DUES',
      }),
      [
        sub({
          id: 'g1',
          service_name: 'Society Gym',
          catalog_service_id: null,
          price_inr: 1500,
          category: 'fitness',
        }),
      ],
    );
    expect(m?.subscription.id).toBe('g1');
  });

  it('never matches on amount alone', () => {
    const m = matchTransaction(
      tx({ merchant_raw: 'RANDOM MERCHANT', raw_text: 'Rs 649 paid to RANDOM MERCHANT' }),
      [sub({})],
    );
    expect(m).toBeNull();
  });

  it('skips cancelled subscriptions', () => {
    const m = matchTransaction(tx({}), [sub({ status: 'cancelled' })]);
    expect(m).toBeNull();
  });

  it('picks the closest of two candidates', () => {
    const near = sub({ id: 'near', next_renewal_date: '2026-06-15' });
    const far = sub({ id: 'far', next_renewal_date: '2026-07-15' });
    const m = matchTransaction(tx({}), [far, near]);
    expect(m?.subscription.id).toBe('near');
  });
});
