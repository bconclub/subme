import type { Subscription } from './types';
import type { NormalizedTransaction } from '../ingestion/types';
import { daysBetween } from './dates';
import { detectService } from './detection';

export interface MatchResult {
  subscription: Subscription;
  /** 0-1 composite of service identity, amount, and renewal-date proximity. */
  score: number;
  amount_delta: number;
  days_from_renewal: number;
}

const AMOUNT_TOLERANCE = 0.05; // ±5% covers GST rounding and price nudges
const DATE_WINDOW_DAYS = 5;

/**
 * Match an incoming transaction to one of the user's existing subscriptions.
 * Used to confirm renewals (advance next_renewal_date + append renewal log)
 * rather than create duplicates.
 */
export function matchTransaction(
  tx: NormalizedTransaction,
  subs: Subscription[],
): MatchResult | null {
  const detected = detectService(tx);
  const txDate = tx.occurred_at.slice(0, 10);
  let best: MatchResult | null = null;

  for (const sub of subs) {
    if (sub.status === 'cancelled') continue;

    let score = 0;

    // Service identity: catalog detection or fuzzy name hit.
    if (detected && sub.catalog_service_id === detected.service.id) {
      score += 0.5 * detected.confidence;
    } else if (nameMatches(tx, sub)) {
      score += 0.35;
    } else {
      continue; // no identity signal at all - never match on amount alone
    }

    // Amount proximity.
    const delta = Math.abs(tx.amount_inr - sub.price_inr);
    const rel = sub.price_inr > 0 ? delta / sub.price_inr : 1;
    if (rel <= AMOUNT_TOLERANCE) {
      score += 0.3 * (1 - rel / AMOUNT_TOLERANCE);
    }

    // Renewal-date proximity.
    const dist = Math.abs(daysBetween(txDate, sub.next_renewal_date));
    if (dist <= DATE_WINDOW_DAYS) {
      score += 0.2 * (1 - dist / (DATE_WINDOW_DAYS + 1));
    }

    if (!best || score > best.score) {
      best = {
        subscription: sub,
        score,
        amount_delta: delta,
        days_from_renewal: dist,
      };
    }
  }

  return best && best.score >= 0.5 ? best : null;
}

function nameMatches(tx: NormalizedTransaction, sub: Subscription): boolean {
  const name = sub.service_name.toLowerCase();
  const tokens = name.split(/\s+/).filter((t) => t.length >= 3);
  if (tokens.length === 0) return false;
  const haystack = `${tx.merchant_raw} ${tx.raw_text}`.toLowerCase();
  return tokens.some((t) => haystack.includes(t));
}
