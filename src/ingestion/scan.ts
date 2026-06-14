import type { PendingDetection } from './engine';
import { processTransactions } from './engine';
import { smsAdapter, simulatedSmsAdapter } from './adapters';
import { useSubsStore, type NewSubscription } from '@/stores/subscriptions';
import { knownDetectionKeys, useDetectionsStore } from '@/stores/detections';
import { useSettingsStore } from '@/stores/settings';
import { nextRenewalAfter } from '@/lib/dates';
import { notifyNewDetections } from '@/lib/notifications';

export interface ScanOutcome {
  newDetections: number;
  renewalsConfirmed: number;
  usedSimulated: boolean;
  permissionDenied: boolean;
}

/**
 * One scan: gather transactions from the best available source, run them
 * through the engine, then apply the result - confirm renewals on tracked
 * subs, queue new detections for review, and notify if anything new turned up.
 *
 * `allowSimulated` (default true) lets the demo feed run when the native SMS
 * source isn't present (Expo Go / web), so the loop is visible before the
 * native build exists.
 */
export async function runScan(
  { allowSimulated = true }: { allowSimulated?: boolean } = {},
): Promise<ScanOutcome> {
  let usedSimulated = false;
  let permissionDenied = false;

  const native = await smsAdapter.isAvailable();
  let txs;
  if (native) {
    const granted = await smsAdapter.ensurePermission();
    if (!granted) {
      return { newDetections: 0, renewalsConfirmed: 0, usedSimulated: false, permissionDenied: true };
    }
    txs = await smsAdapter.collect();
  } else if (allowSimulated) {
    usedSimulated = true;
    txs = await simulatedSmsAdapter.collect();
  } else {
    return { newDetections: 0, renewalsConfirmed: 0, usedSimulated: false, permissionDenied: false };
  }

  const subsStore = useSubsStore.getState();
  const result = processTransactions(txs, {
    subscriptions: subsStore.subs,
    knownKeys: knownDetectionKeys(),
  });

  for (const r of result.renewals) {
    subsStore.recordRenewal(r.subscription_id, r.amount_inr, r.renewed_on);
  }

  const added = useDetectionsStore.getState().addDetections(result.detections);
  useDetectionsStore.getState().markScanned();

  if (added > 0 && useSettingsStore.getState().alertPrefs.enabled) {
    await notifyNewDetections(added);
  }

  return {
    newDetections: added,
    renewalsConfirmed: result.renewals.length,
    usedSimulated,
    permissionDenied,
  };
}

/** Turn a reviewed detection into a real tracked subscription. */
export function confirmDetection(
  detection: PendingDetection,
  overrides?: Partial<NewSubscription>,
): void {
  const today = new Date().toISOString().slice(0, 10);
  const start = detection.first_seen_on || today;
  useSubsStore.getState().add({
    service_name: detection.service_name,
    catalog_service_id: detection.service_id,
    plan_name: detection.suggested_plan_name,
    price_inr: detection.amount_inr,
    billing_cycle: detection.billing_cycle,
    category: detection.category,
    start_date: start,
    source: 'detected',
    ...overrides,
  });
  // Advance the just-created sub past the charge we already saw.
  const subs = useSubsStore.getState().subs;
  const created = subs[subs.length - 1];
  if (created && created.service_name === detection.service_name) {
    useSubsStore
      .getState()
      .update(created.id, {
        next_renewal_date: nextRenewalAfter(start, detection.billing_cycle, start),
      });
  }
  useDetectionsStore.getState().removePending(detection.key);
}
