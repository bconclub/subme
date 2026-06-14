import Svg, { Path, Circle } from 'react-native-svg';
import type { MonthSpendPoint } from '@/lib/analytics';
import { colors } from '@/theme/colors';

/** 12-month spend sparkline, pure SVG. */
export function Sparkline({
  points,
  width = 300,
  height = 56,
}: {
  points: MonthSpendPoint[];
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.total_inr);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pad = 6;

  const xy = (i: number) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (values[i] - min) / range) * (height - pad * 2);
    return { x, y };
  };

  const d = points
    .map((_, i) => {
      const { x, y } = xy(i);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const last = xy(points.length - 1);

  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={colors.accent} strokeWidth={2} fill="none" />
      <Circle cx={last.x} cy={last.y} r={3.5} fill={colors.accent} />
    </Svg>
  );
}
