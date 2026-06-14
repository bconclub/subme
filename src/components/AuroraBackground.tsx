import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';

/**
 * App backdrop. A clean full-bleed charcoal gradient with a faint violet sheen
 * up top — no blobs, no circles. Gives the glass surfaces something subtle to
 * sit on without looking busy. Absolutely positioned, non-interactive.
 */
export function AuroraBackground() {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg }}
    >
      {/* Base tonal gradient, top-left lifted → deep bottom */}
      <LinearGradient
        colors={['#13101C', '#0B0B0F', '#070709']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Soft violet sheen across the top, fading out — rectangular, not a blob */}
      <LinearGradient
        colors={['rgba(124,92,255,0.20)', 'rgba(124,92,255,0.04)', 'rgba(124,92,255,0)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%' }}
      />
    </View>
  );
}
