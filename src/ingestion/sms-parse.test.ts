import { describe, expect, it } from 'vitest';
import { parseMerchant, parseSmsDate, parseSmsTransaction } from './sms-parse';

const RECV = '2026-06-13T10:00:00.000Z';

describe('parseSmsDate', () => {
  it('parses dd-Mon-yy', () => {
    expect(parseSmsDate('on 14-Jun-26 to', '2026-06-13')).toBe('2026-06-14');
  });
  it('parses dd-mm-yyyy', () => {
    expect(parseSmsDate('on 20-06-2026 towards', '2026-06-13')).toBe('2026-06-20');
  });
  it('parses dd/mm/yy', () => {
    expect(parseSmsDate('dated 01/07/26', '2026-06-13')).toBe('2026-07-01');
  });
  it('falls back when no date present', () => {
    expect(parseSmsDate('no date here', '2026-06-13')).toBe('2026-06-13');
  });
});

describe('parseMerchant', () => {
  it('extracts after "at"', () => {
    expect(parseMerchant('Rs 649 spent at NETFLIX.COM on 12-06-26')).toBe('NETFLIX.COM');
  });
  it('extracts after "towards"', () => {
    expect(parseMerchant('debited Rs 1999 towards OPENAI on 20-06-2026')).toBe('OPENAI');
  });
});

describe('parseSmsTransaction', () => {
  it('parses a typical HDFC card debit', () => {
    const tx = parseSmsTransaction(
      'INR 649.00 spent on HDFC Bank Card xx1234 at NETFLIX.COM on 12-06-26. Avl bal 5000',
      RECV,
      'HDFCBK',
    );
    expect(tx).not.toBeNull();
    expect(tx!.amount_inr).toBe(649);
    expect(tx!.account_hint).toBe('XX1234');
    expect(tx!.occurred_at.slice(0, 10)).toBe('2026-06-12');
    expect(tx!.source).toBe('sms');
    expect(tx!.raw_text).toContain('HDFCBK');
  });

  it('parses a UPI debit', () => {
    const tx = parseSmsTransaction(
      'Rs.119 debited from A/c XX4567 on 14-Jun-26 to Spotify via UPI. Ref 123456',
      RECV,
    );
    expect(tx!.amount_inr).toBe(119);
    expect(tx!.account_hint).toBe('XX4567');
    expect(tx!.occurred_at.slice(0, 10)).toBe('2026-06-14');
  });

  it('strips comma thousands separators', () => {
    const tx = parseSmsTransaction(
      'Your a/c XX1234 debited for Rs 1,999.00 on 20-06-2026 towards OPENAI',
      RECV,
    );
    expect(tx!.amount_inr).toBe(1999);
  });

  it('returns null for a credit / non-debit message', () => {
    expect(
      parseSmsTransaction('Rs 5000 credited to your account from SALARY', RECV),
    ).toBeNull();
  });

  it('returns null for OTP / promo with no amount', () => {
    expect(parseSmsTransaction('Your OTP is 123456. Do not share.', RECV)).toBeNull();
  });

  it('gives the same id for the same message (stable dedupe)', () => {
    const body = 'INR 349 spent at JIO PREPAID on 18-06-26';
    const a = parseSmsTransaction(body, RECV, 'JIOPAY');
    const b = parseSmsTransaction(body, RECV, 'JIOPAY');
    expect(a!.id).toBe(b!.id);
  });
});
