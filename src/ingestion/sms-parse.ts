import type { NormalizedTransaction } from './types';

/** Stable 32-bit hash → hex. Same SMS always yields the same id, so the
 *  engine can dedupe re-scanned messages without a DB roundtrip. */
function stableId(prefix: string, ...parts: (string | number)[]): string {
  const s = parts.join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${prefix}_${(h >>> 0).toString(16)}`;
}

/**
 * Parse an Indian bank/UPI debit SMS into a NormalizedTransaction.
 * Best-effort + defensive: returns null when the message clearly isn't a
 * debit we can use. Merchant extraction is heuristic - downstream detection
 * also scans the full raw text, so a rough merchant guess is fine.
 */

const DEBIT_HINTS =
  /\b(spent|debited|debit|paid|payment|towards|purchase|charged|deducted)\b/i;
const CREDIT_ONLY = /\b(credited to your|received|refund|cashback|reversed)\b/i;

const AMOUNT_RE = /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
const ACCT_RE =
  /(?:a\/c|acct|account|card)\s*(?:no\.?|ending)?\s*[xX*]+\s*(\d{3,4})/i;

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

/** Pull an ISO date out of common Indian SMS date formats. */
export function parseSmsDate(text: string, fallbackISO: string): string {
  // dd-Mon-yy / dd Mon yyyy
  const named = text.match(/(\d{1,2})[-\s]([A-Za-z]{3})[A-Za-z]*[-\s'](\d{2,4})/);
  if (named) {
    const d = +named[1];
    const m = MONTHS[named[2].toLowerCase()];
    let y = +named[3];
    if (m && d) {
      if (y < 100) y += 2000;
      return `${y}-${pad2(m)}-${pad2(d)}`;
    }
  }
  // dd-mm-yy / dd/mm/yyyy
  const numeric = text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (numeric) {
    const d = +numeric[1];
    const m = +numeric[2];
    let y = +numeric[3];
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      if (y < 100) y += 2000;
      return `${y}-${pad2(m)}-${pad2(d)}`;
    }
  }
  return fallbackISO;
}

/** Heuristic merchant name from "at X", "to X", "towards X", "X credited". */
export function parseMerchant(text: string): string {
  const patterns = [
    /\bat\s+([A-Z0-9][A-Z0-9 .*&_-]{2,30})/,
    /\b(?:to|towards)\s+([A-Z0-9][A-Z0-9 .*&_-]{2,30})/,
    /\bvia\s+([A-Z0-9][A-Za-z0-9 .*&_-]{2,30})/,
    /([A-Z][A-Z0-9.*_-]{2,30})\s+credited/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      return m[1]
        .replace(/\b(on|ref|upi|via|dated|txn|info|avl|bal)\b.*$/i, '')
        .replace(/[.\s]+$/, '')
        .trim();
    }
  }
  return '';
}

export function parseSmsTransaction(
  body: string,
  receivedAtISO: string,
  sender = '',
): NormalizedTransaction | null {
  if (!DEBIT_HINTS.test(body)) return null;
  if (CREDIT_ONLY.test(body) && !/\bdebited|spent|paid\b/i.test(body)) return null;

  const amountMatch = body.match(AMOUNT_RE);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const acct = body.match(ACCT_RE);
  const occurredDate = parseSmsDate(body, receivedAtISO.slice(0, 10));

  return {
    id: stableId('sms', sender, occurredDate, amount, body),
    source: 'sms',
    merchant_raw: parseMerchant(body),
    amount_inr: amount,
    currency: 'INR',
    occurred_at: `${occurredDate}T00:00:00.000Z`,
    account_hint: acct ? `XX${acct[1]}` : null,
    raw_text: `${sender ? sender + ': ' : ''}${body}`.trim(),
  };
}
