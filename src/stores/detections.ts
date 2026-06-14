import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PendingDetection } from '@/ingestion/engine';

/**
 * The review queue. Auto-detected subscriptions land here as `pending` until
 * the user confirms (→ becomes a real subscription) or dismisses (→ key
 * remembered so we never nag again).
 */
interface DetectionsState {
  pending: PendingDetection[];
  /** Detection keys the user confirmed or dismissed - suppress on re-scan. */
  resolvedKeys: string[];
  lastScanAt: string | null;
  hydrated: boolean;

  /** Merge a fresh batch from the engine; skips keys already pending/resolved. */
  addDetections: (incoming: PendingDetection[]) => number;
  removePending: (key: string) => void;
  dismiss: (key: string) => void;
  markScanned: () => void;
  clearAll: () => void;
}

export const useDetectionsStore = create<DetectionsState>()(
  persist(
    (set, get) => ({
      pending: [],
      resolvedKeys: [],
      lastScanAt: null,
      hydrated: false,

      addDetections: (incoming) => {
        const { pending, resolvedKeys } = get();
        const have = new Set([...pending.map((d) => d.key), ...resolvedKeys]);
        const fresh = incoming.filter((d) => !have.has(d.key));
        if (fresh.length) set({ pending: [...fresh, ...pending] });
        return fresh.length;
      },

      removePending: (key) =>
        set((s) => ({
          pending: s.pending.filter((d) => d.key !== key),
          resolvedKeys: s.resolvedKeys.includes(key)
            ? s.resolvedKeys
            : [...s.resolvedKeys, key],
        })),

      dismiss: (key) =>
        set((s) => ({
          pending: s.pending.filter((d) => d.key !== key),
          resolvedKeys: s.resolvedKeys.includes(key)
            ? s.resolvedKeys
            : [...s.resolvedKeys, key],
        })),

      markScanned: () => set({ lastScanAt: new Date().toISOString() }),

      clearAll: () => set({ pending: [], resolvedKeys: [], lastScanAt: null }),
    }),
    {
      name: 'subme.detections.v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useDetectionsStore.setState({ hydrated: true });
      },
      partialize: (s) => ({
        pending: s.pending,
        resolvedKeys: s.resolvedKeys,
        lastScanAt: s.lastScanAt,
      }),
    },
  ),
);

/** Keys to exclude from re-detection: currently pending + already resolved. */
export function knownDetectionKeys(): Set<string> {
  const s = useDetectionsStore.getState();
  return new Set([...s.pending.map((d) => d.key), ...s.resolvedKeys]);
}
