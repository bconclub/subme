import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/theme/colors';

/**
 * Ambient aurora: soft colored light-blobs on the deep canvas. This is what
 * the frosted glass surfaces refract - without it, blur has nothing to show.
 * Absolutely positioned, non-interactive, sits behind all screen content.
 */
export function AuroraBackground() {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg }}
    >
      <Blob colorsPair={gradients.aurora1} size={420} top={-120} left={-110} />
      <Blob colorsPair={gradients.aurora2} size={460} top={120} left={140} />
      <Blob colorsPair={gradients.aurora3} size={380} top={460} left={-90} />
    </View>
  );
}

function Blob({
  colorsPair,
  size,
  top,
  left,
}: {
  colorsPair: readonly [string, string];
  size: number;
  top: number;
  left: number;
}) {
  return (
    <LinearGradient
      colors={colorsPair}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        top,
        left,
        borderRadius: size / 2,
        opacity: 0.45,
      }}
    />
  );
}
