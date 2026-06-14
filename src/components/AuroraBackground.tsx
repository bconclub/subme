import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';

/**
 * App backdrop. One clean full-bleed charcoal gradient — a whisper of violet at
 * the very top easing into deep charcoal at the bottom. Even and subtle: no
 * hard seam, no blobs. The glass surfaces and lime/violet accents carry the
 * visual interest; the background just sits behind them.
 */
export function AuroraBackground() {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg }}
    >
      <LinearGradient
        colors={['#120E1C', '#0B0B0F', '#08080B']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </View>
  );
}
