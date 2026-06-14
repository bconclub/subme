/**
 * Subme dark glassmorphism system.
 * Surfaces are frosted glass (expo-blur) floating over an aurora gradient,
 * so colors here are mostly translucent overlays + bright accents that read
 * against deep near-black.
 */
export const colors = {
  // Base canvas (behind the aurora)
  bg: '#06080C',
  bgDeep: '#04060A',

  // Glass overlays (painted on top of BlurView)
  glass: 'rgba(255,255,255,0.06)',
  glassStrong: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassBorderStrong: 'rgba(255,255,255,0.20)',
  hairline: 'rgba(255,255,255,0.08)',

  // Legacy solid surfaces (used where blur isn't worth it)
  surface: '#0E141C',
  card: '#121A24',
  border: 'rgba(255,255,255,0.10)',

  // Text
  ink: '#F2F6FC',
  muted: '#9FB0C3',
  faint: '#6B7B8F',

  // Brand accents
  accent: '#34E5B0',
  accentDim: '#10B981',
  violet: '#8B7CFF',
  blue: '#5B9DFF',
  warn: '#FFC24B',
  danger: '#FF6B6B',
  info: '#5B9DFF',
} as const;

/** Gradient stop pairs for LinearGradient. */
export const gradients = {
  hero: ['#1FE0C4', '#2EA8FF'] as const,
  aurora1: ['#16E0B0', 'rgba(22,224,176,0)'] as const,
  aurora2: ['#7C5CFF', 'rgba(124,92,255,0)'] as const,
  aurora3: ['#2E8BFF', 'rgba(46,139,255,0)'] as const,
  upgrade: ['#8B7CFF', '#5B9DFF'] as const,
  danger: ['#FF7A7A', '#FF4D6D'] as const,
};

export const CATEGORY_COLORS: Record<string, string> = {
  streaming: '#FF6B6B',
  music: '#34E5B0',
  telecom: '#5B9DFF',
  food: '#FF9F45',
  fitness: '#FF6FB5',
  productivity: '#A78BFA',
  ai: '#2DE0CF',
  shopping: '#FFC24B',
  news: '#9FB0C3',
  gaming: '#5BE584',
  education: '#5BB8FF',
  finance: '#FFD24B',
  other: '#7E8BA0',
};
