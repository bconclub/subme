import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { AlertPrefs, ConsentRecord, ConsentType, Profile } from '@/lib/types';

interface SettingsState {
  profile: Profile;
  alertPrefs: AlertPrefs;
  consents: ConsentRecord[];
  onboardingDone: boolean;
  hydrated: boolean;

  updateProfile: (patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'email'>>) => void;
  setAlertPrefs: (patch: Partial<AlertPrefs>) => void;
  setConsent: (type: ConsentType, granted: boolean) => void;
  getConsent: (type: ConsentType) => boolean;
  completeOnboarding: () => void;
  resetAll: () => void;
}

const defaultProfile = (): Profile => ({
  id: 'local',
  email: null,
  phone: null,
  full_name: null,
  plan: 'free',
  created_at: new Date().toISOString(),
});

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile(),
      alertPrefs: { enabled: true, days_before: 2 },
      consents: [],
      onboardingDone: false,
      hydrated: false,

      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),

      setAlertPrefs: (patch) =>
        set((s) => ({ alertPrefs: { ...s.alertPrefs, ...patch } })),

      setConsent: (type, granted) => {
        const now = new Date().toISOString();
        set((s) => {
          const existing = s.consents.find((c) => c.consent_type === type);
          if (existing) {
            return {
              consents: s.consents.map((c) =>
                c.consent_type === type
                  ? {
                      ...c,
                      granted,
                      granted_at: granted ? now : c.granted_at,
                      revoked_at: granted ? null : now,
                      version: c.version + (granted === c.granted ? 0 : 1),
                    }
                  : c,
              ),
            };
          }
          return {
            consents: [
              ...s.consents,
              {
                id: Crypto.randomUUID(),
                user_id: s.profile.id,
                consent_type: type,
                granted,
                granted_at: granted ? now : null,
                revoked_at: granted ? null : now,
                version: 1,
              },
            ],
          };
        });
      },

      getConsent: (type) =>
        get().consents.find((c) => c.consent_type === type)?.granted ?? false,

      completeOnboarding: () => set({ onboardingDone: true }),

      resetAll: () =>
        set({
          profile: defaultProfile(),
          alertPrefs: { enabled: true, days_before: 2 },
          consents: [],
          onboardingDone: false,
        }),
    }),
    {
      name: 'subme.settings.v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useSettingsStore.setState({ hydrated: true });
      },
      partialize: (s) => ({
        profile: s.profile,
        alertPrefs: s.alertPrefs,
        consents: s.consents,
        onboardingDone: s.onboardingDone,
      }),
    },
  ),
);
