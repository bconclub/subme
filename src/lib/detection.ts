import type { CatalogService } from './types';
import type { NormalizedTransaction } from '../ingestion/types';
import { CATALOG } from './catalog';

export interface DetectionResult {
  service: CatalogService;
  /** 0-1. Pattern hit in merchant string scores higher than body text. */
  confidence: number;
  matched_pattern: string;
}

/**
 * Match a normalized transaction against catalog detection patterns.
 * Pure function - safe to run over historical SMS batches.
 */
export function detectService(
  tx: NormalizedTransaction,
  catalog: CatalogService[] = CATALOG,
): DetectionResult | null {
  const merchant = tx.merchant_raw.toLowerCase();
  const body = tx.raw_text.toLowerCase();
  let best: DetectionResult | null = null;

  for (const service of catalog) {
    for (const pattern of service.detection_patterns) {
      let re: RegExp;
      try {
        re = new RegExp(pattern, 'i');
      } catch {
        continue; // bad pattern in catalog must never crash ingestion
      }
      let confidence = 0;
      let amountMatches = false;
      if (service.plans.some((p) => p.price_inr === tx.amount_inr)) {
        amountMatches = true;
      }
      if (re.test(merchant)) {
        confidence = amountMatches ? 0.95 : 0.8;
      } else if (re.test(body)) {
        confidence = amountMatches ? 0.85 : 0.6;
      }
      if (confidence > 0 && (!best || confidence > best.confidence)) {
        best = { service, confidence, matched_pattern: pattern };
      }
    }
  }
  return best;
}

/** All candidates above a threshold, best first - for a disambiguation UI. */
export function detectCandidates(
  tx: NormalizedTransaction,
  threshold = 0.5,
  catalog: CatalogService[] = CATALOG,
): DetectionResult[] {
  const results: DetectionResult[] = [];
  for (const service of catalog) {
    const single = detectService(tx, [service]);
    if (single && single.confidence >= threshold) results.push(single);
  }
  return results.sort((a, b) => b.confidence - a.confidence);
}
