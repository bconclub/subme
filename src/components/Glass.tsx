import { ReactNode } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/theme/colors';

/**
 * Frosted-glass surface: native BlurView + a translucent white wash + a
 * 1px light border, so it reads as physical glass over the aurora.
 *
 * `intensity` ~ how frosted (40 subtle → 80 heavy). `tone='strong'` brightens
 * the wash + border for hero / focused cards.
 */
export function Glass({
  children,
  style,
  intensity = 50,
  tone = 'base',
  radius = 24,
  padded = true,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tone?: 'base' | 'strong';
  radius?: number;
  padded?: boolean;
}) {
  const wash = tone === 'strong' ? colors.glassStrong : colors.glass;
  const border = tone === 'strong' ? colors.glassBorderStrong : colors.glassBorder;

  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: border,
          backgroundColor:
            // Web BlurView falls back weakly; give it a real translucent base.
            Platform.OS === 'web' ? 'rgba(18,26,36,0.72)' : 'transparent',
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ backgroundColor: wash, padding: padded ? 16 : 0 }}>{children}</View>
    </View>
  );
}
