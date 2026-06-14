import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSettingsStore } from '@/stores/settings';
import { colors } from '@/theme/colors';

export default function Index() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return <Redirect href={onboardingDone ? '/(tabs)/inbox' : '/onboarding'} />;
}
