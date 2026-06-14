import { describe, expect, it } from 'vitest';
import { detectCandidates, detectService } from './detection';
import type { NormalizedTransaction } from '../ingestion/types';

function tx(partial: Partial<NormalizedTransaction>): NormalizedTransaction {
  return {
    id: 't1',
    source: 'sms',
    merchant_raw: '',
    amount_inr: 0,
    currency: 'INR',
    occurred_at: '2026-06-12T04:00:00Z',
    account_hint: null,
    raw_text: '',
    ...partial,
  };
}

describe('detectService', () => {
  it('detects Netflix from a typical bank SMS', () => {
    const r = detectService(
      tx({
        merchant_raw: 'NETFLIX.COM',
        amount_inr: 649,
        raw_text:
          'INR 649.00 spent on HDFC Bank Card XX1234 at NETFLIX.COM on 12-06-2026',
      }),
    );
    expect(r?.service.slug).toBe('netflix');
    expect(r?.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects from body text when merchant is a PG alias', () => {
    const r = detectService(
      tx({
        merchant_raw: 'RAZORPAY',
        amount_inr: 119,
        raw_text: 'Payment of Rs.119 to Spotify India via Razorpay successful',
      }),
    );
    expect(r?.service.slug).toBe('spotify');
  });

  it('boosts confidence when amount matches a plan price', () => {
    const withAmount = detectService(
      tx({ merchant_raw: 'NETFLIX', amount_inr: 649, raw_text: 'NETFLIX' }),
    );
    const withoutAmount = detectService(
      tx({ merchant_raw: 'NETFLIX', amount_inr: 123, raw_text: 'NETFLIX' }),
    );
    expect(withAmount!.confidence).toBeGreaterThan(withoutAmount!.confidence);
  });

  it('returns null for unknown merchants', () => {
    const r = detectService(
      tx({ merchant_raw: 'LOCAL KIRANA STORE', raw_text: 'Paid Rs 250 to LOCAL KIRANA STORE' }),
    );
    expect(r).toBeNull();
  });

  it('does not let a malformed pattern crash detection', () => {
    const r = detectService(
      tx({ merchant_raw: 'NETFLIX', raw_text: 'NETFLIX' }),
      [
        {
          id: 'bad',
          name: 'Bad',
          slug: 'bad',
          category: 'other',
          plans: [],
          detection_patterns: ['([unclosed'],
          logo_color: '#000',
          website: '',
          popular_rank: null,
        },
      ],
    );
    expect(r).toBeNull();
  });
});

describe('detectCandidates', () => {
  it('returns ranked candidates above threshold', () => {
    const list = detectCandidates(
      tx({
        merchant_raw: 'GOOGLE *YouTubePremium',
        amount_inr: 149,
        raw_text: 'GOOGLE *YouTubePremium charged Rs 149',
      }),
    );
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].service.slug).toBe('youtube-premium');
  });
});
