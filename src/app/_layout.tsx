import '../global.css';
import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useSubsStore } from '@/stores/subscriptions';
import { useSettingsStore } from '@/stores/settings';
import { useDetectionsStore } from '@/stores/detections';
import { rescheduleAllAlerts } from '@/lib/notifications';
import { runScan } from '@/ingestion/scan';
import { colors } from '@/theme/colors';

const queryClient = new QueryClient();

// Default every Text/TextInput to the brand body face (Plus Jakarta Sans).
// Display/numeral moments opt into Space Grotesk via the `font-display` class.
function applyDefaultFont() {
  const T = Text as unknown as { defaultProps?: Record<string, unknown> };
  T.defaultProps = T.defaultProps || {};
  T.defaultProps.style = [{ fontFamily: 'PlusJakartaSans_400Regular' }, (T.defaultProps.style as object) ?? null];
  const TI = TextInput as unknown as { defaultProps?: Record<string, unknown> };
  TI.defaultProps = TI.defaultProps || {};
  TI.defaultProps.style = [{ fontFamily: 'PlusJakartaSans_400Regular' }, (TI.defaultProps.style as object) ?? null];
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  if (fontsLoaded) applyDefaultFont();

  const hydrated = useSubsStore((s) => s.hydrated);
  const detectionsHydrated = useDetectionsStore((s) => s.hydrated);
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);
  const rollForward = useSubsStore((s) => s.rollForward);
  const subs = useSubsStore((s) => s.subs);
  const alertPrefs = useSettingsStore((s) => s.alertPrefs);

  // On launch (post-hydration): log overdue renewals forward, then make the
  // scheduled notifications reflect current state.
  useEffect(() => {
    if (!hydrated) return;
    rollForward();
    rescheduleAllAlerts(useSubsStore.getState().subs, alertPrefs).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Auto-scan for new subscriptions once everything is loaded and the user is
  // past onboarding. Detections dedupe themselves, so this is safe every launch.
  useEffect(() => {
    if (!hydrated || !detectionsHydrated || !onboardingDone) return;
    runScan().catch(() => {});
  }, [hydrated, detectionsHydrated, onboardingDone]);

  // Reschedule whenever subscriptions or prefs change.
  useEffect(() => {
    if (!hydrated) return;
    rescheduleAllAlerts(subs, alertPrefs).catch(() => {});
  }, [subs, alertPrefs, hydrated]);

  if (!fontsLoaded) {
    return <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
