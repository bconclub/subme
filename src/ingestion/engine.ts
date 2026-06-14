import type { BillingCycle, Category, Subscription } from '@/lib/types';
import { detectService } from '@/lib/detection';
import { matchTransaction } from '@/lib/matching';
import { inferBillingCycle } from './infer';
import type { IngestionSource, NormalizedTransaction } from './types';

/**
 * The ingestion engine: the single place every source's transactions flow
 * through. For each normalized transaction it decides one of three things -
 *
 *  - RENEWAL of a subscription you already track  → confirm + advance it
 *  - a NEW subscription we detected               → queue for one-tap review
 *  - NOISE (no service match / low confidence)    → drop
 *
 * Pure and deterministic: no store, no I/O. Stores call this and persist the
 * result. This is the "bring it all in and check it" core.
 */

export interface PendingDetection {
  /** Stable key for dedupe across re-scans: service + amount + account. */
  key: string;
  source: IngestionSource;
  service_slug: string;
  service_id: string;
  service_name: string;
  category: Category;
  suggested_plan_name: string;
  amount_inr: number;
  billing_cycle: BillingCycle;
  confidence: number;
  account_hint: string | null;
  /** ISO date of the transaction that triggered detection. */
  first_seen_on: string;
  evidence: string;
}

export interface RenewalConfirmation {
  subscription_id: string;
  amount_inr: number;
  renewed_on: string;
  source: IngestionSource;
}

export interface EngineResult {
  detections: PendingDetection[];
  renewals: RenewalConfirmation[];
  processed: number;
  ignored: number;
}

export interface EngineContext {
  subscriptions: Subscription[];
  /** Detection keys already pending or dismissed - never re-surface these. */
  knownKeys: Set<string>;
  /** Minimum detection confidence to surface for review. */
  threshold?: number;
}

function detectionKey(serviceSlug: string, amount: number, acct: string | null): string {
  return `${serviceSlug}:${Math.round(amount)}:${acct ?? '-'}`;
}

export function processTransactions(
  txs: NormalizedTransaction[],
  ctx: EngineContext,
): EngineResult {
  const threshold = ctx.threshold ?? 0.6;
  const detections: PendingDetection[] = [];
  const renewals: RenewalConfirmation[] = [];
  const seenThisRun = new Set<string>();
  let ignored = 0;

  // Newest first, so the detection we surface reflects the latest charge.
  const ordered = [...txs].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

  for (const tx of ordered) {
    // 1. Is this a renewal of something already tracked? (the "check" step)
    const match = matchTransaction(tx, ctx.subscriptions);
    if (match) {
      renewals.push({
        subscription_id: match.subscription.id,
        amount_inr: tx.amount_inr,
        renewed_on: tx.occurred_at.slice(0, 10),
        source: tx.source,
      });
      continue;
    }

    // 2. New subscription?
    const detected = detectService(tx);
    if (!detected || detected.confidence < threshold) {
      ignored += 1;
      continue;
    }

    const key = detectionKey(detected.service.slug, tx.amount_inr, tx.account_hint);
    if (ctx.knownKeys.has(key) || seenThisRun.has(key)) continue;
    seenThisRun.add(key);

    const plan = detected.service.plans.find((p) => p.price_inr === tx.amount_inr);
    detections.push({
      key,
      source: tx.source,
      service_slug: detected.service.slug,
      service_id: detected.service.id,
      service_name: detected.service.name,
      category: detected.service.category,
      suggested_plan_name: plan?.name ?? '',
      amount_inr: tx.amount_inr,
      billing_cycle: plan?.billing_cycle ?? inferBillingCycle(tx.amount_inr, detected.service),
      confidence: detected.confidence,
      account_hint: tx.account_hint,
      first_seen_on: tx.occurred_at.slice(0, 10),
      evidence: tx.raw_text.slice(0, 160),
    });
  }

  return {
    detections,
    renewals,
    processed: txs.length,
    ignored,
  };
}
