import { ReactNode } from 'react';
import { Platform, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/theme/colors';

/**
 * Frosted-glass card. Drop-in for the old solid Card: same `className` API
 * (applied to the content layer), now floating glass over the aurora.
 * `tone="strong"` brightens it for hero surfaces.
 */
export function Card({
  children,
  className,
  tone = 'base',
  intensity = 45,
  ...rest
}: ViewProps & {
  children: ReactNode;
  tone?: 'base' | 'strong';
  intensity?: number;
}) {
  const wash = tone === 'strong' ? colors.glassStrong : colors.glass;
  const border = tone === 'strong' ? colors.glassBorderStrong : colors.glassBorder;
  return (
    <View
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: border,
        backgroundColor: Platform.OS === 'web' ? 'rgba(18,26,36,0.7)' : 'transparent',
      }}
      {...rest}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ backgroundColor: wash }} className={`p-4 ${className ?? ''}`}>
        {children}
      </View>
    </View>
  );
}
