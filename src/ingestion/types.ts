/**
 * Ingestion contract - the landing zone for future SMS / notification-listener /
 * account-aggregator sources. Every source normalizes raw signals into
 * `NormalizedTransaction` before anything downstream (detection, matching)
 * sees them. Do not add source-specific fields outside `raw`.
 */

export type IngestionSource =
  | 'manual'
  | 'sms'
  | 'notification_listener'
  | 'email'
  | 'account_aggregator';

export interface NormalizedTransaction {
  /** Stable id derived from source + raw payload hash. */
  id: string;
  source: IngestionSource;
  /** Merchant string as the source reported it, uncleaned. */
  merchant_raw: string;
  /** Amount in INR. Positive = debit from the user. */
  amount_inr: number;
  currency: 'INR';
  /** ISO 8601 instant the transaction occurred. */
  occurred_at: string;
  /** Masked account/card hint, e.g. "XX1234", if the source exposed one. */
  account_hint: string | null;
  /** Full raw text (SMS body, notification text) for pattern matching. */
  raw_text: string;
  /** Set by detection: catalog slug of the best-matched service. */
  detected_service_slug?: string;
  /** Detection confidence 0-1. */
  confidence?: number;
}

export interface IngestionAdapter {
  source: IngestionSource;
  /** Whether the platform + user consent allow this adapter to run. */
  isAvailable(): Promise<boolean>;
  /** Pull or receive raw events and normalize them. */
  collect(): Promise<NormalizedTransaction[]>;
}
