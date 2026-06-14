import type { BillingCycle, CatalogService } from '@/lib/types';

/**
 * When a detected charge amount doesn't exactly equal a catalog plan price,
 * guess the billing cycle from the closest plan, falling back to the service's
 * most common cycle, then monthly.
 */
export function inferBillingCycle(
  amount: number,
  service: CatalogService,
): BillingCycle {
  if (service.plans.length === 0) return 'monthly';

  let closest = service.plans[0];
  let bestDelta = Math.abs(service.plans[0].price_inr - amount);
  for (const p of service.plans) {
    const d = Math.abs(p.price_inr - amount);
    if (d < bestDelta) {
      bestDelta = d;
      closest = p;
    }
  }
  // Within 15% of a plan price → trust that plan's cycle.
  if (closest.price_inr > 0 && bestDelta / closest.price_inr <= 0.15) {
    return closest.billing_cycle;
  }

  const counts = new Map<BillingCycle, number>();
  for (const p of service.plans) {
    counts.set(p.billing_cycle, (counts.get(p.billing_cycle) ?? 0) + 1);
  }
  let mode: BillingCycle = 'monthly';
  let max = 0;
  for (const [cycle, n] of counts) {
    if (n > max) {
      max = n;
      mode = cycle;
    }
  }
  return mode;
}
