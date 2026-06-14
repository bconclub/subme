import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type {
  BillingCycle,
  Category,
  PriceHistoryEntry,
  RenewalLogEntry,
  Subscription,
} from '@/lib/types';
import { daysBetween, nextRenewalAfter, todayIST } from '@/lib/dates';

export interface NewSubscription {
  service_name: string;
  catalog_service_id: string | null;
  plan_name: string;
  price_inr: number;
  billing_cycle: BillingCycle;
  category: Category;
  start_date: string;
  notes?: string;
  source?: 'manual' | 'detected';
}

interface SubsState {
  subs: Subscription[];
  priceHistory: PriceHistoryEntry[];
  renewalLog: RenewalLogEntry[];
  hydrated: boolean;

  add: (input: NewSubscription) => Subscription;
  update: (
    id: string,
    patch: Partial<
      Pick<
        Subscription,
        | 'service_name'
        | 'plan_name'
        | 'price_inr'
        | 'billing_cycle'
        | 'category'
        | 'start_date'
        | 'next_renewal_date'
        | 'notes'
      >
    >,
  ) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  cancel: (id: string) => void;
  remove: (id: string) => void;
  /** Advance overdue renewals: append renewal_log + move next_renewal_date. */
  rollForward: () => number;
  /** Record a charge confirmed by ingestion (SMS etc.) against a tracked sub. */
  recordRenewal: (subId: string, amount: number, renewedOn: string) => void;
  clearAll: () => void;
}

const LOCAL_USER = 'local';

function uuid(): string {
  return Crypto.randomUUID();
}

export const useSubsStore = create<SubsState>()(
  persist(
    (set, get) => ({
      subs: [],
      priceHistory: [],
      renewalLog: [],
      hydrated: false,

      add: (input) => {
        const now = new Date().toISOString();
        const today = todayIST();
        const sub: Subscription = {
          id: uuid(),
          user_id: LOCAL_USER,
          service_name: input.service_name.trim(),
          catalog_service_id: input.catalog_service_id,
          plan_name: input.plan_name,
          price_inr: input.price_inr,
          billing_cycle: input.billing_cycle,
          category: input.category,
          status: 'active',
          start_date: input.start_date,
          // Start date today/future: first charge IS the start date.
          // Past start date: next charge due from the cycle anchor.
          next_renewal_date:
            daysBetween(today, input.start_date) >= 0
              ? input.start_date
              : nextRenewalAfter(input.start_date, input.billing_cycle),
          notes: input.notes ?? '',
          source: input.source ?? 'manual',
          created_at: now,
          updated_at: now,
          paused_at: null,
          cancelled_at: null,
        };
        const entry: PriceHistoryEntry = {
          id: uuid(),
          subscription_id: sub.id,
          price_inr: sub.price_inr,
          effective_from: sub.start_date,
          created_at: now,
        };
        set((s) => ({
          subs: [...s.subs, sub],
          priceHistory: [...s.priceHistory, entry],
        }));
        return sub;
      },

      update: (id, patch) => {
        const now = new Date().toISOString();
        set((s) => {
          const subs = s.subs.map((sub) => {
            if (sub.id !== id) return sub;
            const next: Subscription = { ...sub, ...patch, updated_at: now };
            // Re-derive renewal date if cycle/start changed without explicit date.
            if (
              (patch.billing_cycle || patch.start_date) &&
              !patch.next_renewal_date
            ) {
              next.next_renewal_date = nextRenewalAfter(
                next.start_date,
                next.billing_cycle,
              );
            }
            return next;
          });
          const before = s.subs.find((x) => x.id === id);
          const after = subs.find((x) => x.id === id);
          let priceHistory = s.priceHistory;
          if (before && after && before.price_inr !== after.price_inr) {
            priceHistory = [
              ...priceHistory,
              {
                id: uuid(),
                subscription_id: id,
                price_inr: after.price_inr,
                effective_from: todayIST(),
                created_at: now,
              },
            ];
          }
          return { subs, priceHistory };
        });
      },

      pause: (id) => {
        const now = new Date().toISOString();
        set((s) => ({
          subs: s.subs.map((sub) =>
            sub.id === id
              ? { ...sub, status: 'paused', paused_at: now, updated_at: now }
              : sub,
          ),
        }));
      },

      resume: (id) => {
        const now = new Date().toISOString();
        set((s) => ({
          subs: s.subs.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  status: 'active',
                  paused_at: null,
                  cancelled_at: null,
                  updated_at: now,
                  next_renewal_date: nextRenewalAfter(
                    sub.start_date,
                    sub.billing_cycle,
                  ),
                }
              : sub,
          ),
        }));
      },

      cancel: (id) => {
        const now = new Date().toISOString();
        set((s) => ({
          subs: s.subs.map((sub) =>
            sub.id === id
              ? { ...sub, status: 'cancelled', cancelled_at: now, updated_at: now }
              : sub,
          ),
        }));
      },

      remove: (id) => {
        set((s) => ({
          subs: s.subs.filter((sub) => sub.id !== id),
          priceHistory: s.priceHistory.filter((p) => p.subscription_id !== id),
          renewalLog: s.renewalLog.filter((r) => r.subscription_id !== id),
        }));
      },

      rollForward: () => {
        const today = todayIST();
        const nowIso = new Date().toISOString();
        let advanced = 0;
        const newLogs: RenewalLogEntry[] = [];
        set((s) => {
          const subs = s.subs.map((sub) => {
            if (sub.status !== 'active') return sub;
            let renewal = sub.next_renewal_date;
            let changed = false;
            // Guard: at most ~3 years of weekly catch-up.
            for (let i = 0; i < 160 && daysBetween(renewal, today) > 0; i++) {
              newLogs.push({
                id: uuid(),
                subscription_id: sub.id,
                renewed_on: renewal,
                amount_inr: sub.price_inr,
                created_at: nowIso,
              });
              renewal = nextRenewalAfter(sub.start_date, sub.billing_cycle, renewal);
              changed = true;
            }
            if (!changed) return sub;
            advanced += 1;
            return { ...sub, next_renewal_date: renewal, updated_at: nowIso };
          });
          return { subs, renewalLog: [...s.renewalLog, ...newLogs] };
        });
        return advanced;
      },

      recordRenewal: (subId, amount, renewedOn) => {
        const nowIso = new Date().toISOString();
        set((s) => {
          // Skip if this exact charge is already logged (idempotent re-scan).
          const dupe = s.renewalLog.some(
            (r) =>
              r.subscription_id === subId &&
              r.renewed_on === renewedOn &&
              r.amount_inr === amount,
          );
          const renewalLog = dupe
            ? s.renewalLog
            : [
                ...s.renewalLog,
                {
                  id: uuid(),
                  subscription_id: subId,
                  renewed_on: renewedOn,
                  amount_inr: amount,
                  created_at: nowIso,
                },
              ];
          const subs = s.subs.map((sub) => {
            if (sub.id !== subId || sub.status !== 'active') return sub;
            // If the charge is at/after the expected renewal, advance the date.
            const next =
              daysBetween(renewedOn, sub.next_renewal_date) <= 0
                ? nextRenewalAfter(sub.start_date, sub.billing_cycle, renewedOn)
                : sub.next_renewal_date;
            return { ...sub, next_renewal_date: next, updated_at: nowIso };
          });
          return { subs, renewalLog };
        });
      },

      clearAll: () => set({ subs: [], priceHistory: [], renewalLog: [] }),
    }),
    {
      name: 'subme.subscriptions.v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useSubsStore.setState({ hydrated: true });
      },
      partialize: (s) => ({
        subs: s.subs,
        priceHistory: s.priceHistory,
        renewalLog: s.renewalLog,
      }),
    },
  ),
);
