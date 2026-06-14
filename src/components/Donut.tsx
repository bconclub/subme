import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import type { CategorySlice } from '@/lib/analytics';
import { CATEGORY_COLORS, colors } from '@/theme/colors';

/**
 * Category share donut. Pure SVG - no chart lib so the APK stays lean and the
 * render is deterministic.
 */
export function Donut({
  slices,
  size = 160,
  strokeWidth = 22,
}: {
  slices: CategorySlice[];
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  // Precompute each slice's start offset (running sum of arc lengths).
  const offsets = slices.reduce<number[]>((acc, s, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + slices[i - 1].share * c);
    return acc;
  }, []);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {slices.map((s, i) => {
            const len = s.share * c;
            return (
              <Circle
                key={s.category}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={CATEGORY_COLORS[s.category] ?? colors.muted}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${Math.max(len - 2, 0)} ${c}`}
                strokeDashoffset={-offsets[i]}
                strokeLinecap="butt"
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
