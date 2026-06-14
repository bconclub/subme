/**
 * Subme design system — charcoal canvas, vivid-violet brand, electric-lime
 * accent. Glassy dark surfaces. Lime carries the "live / primary / good"
 * signal; violet is the brand / hero / upgrade color.
 * Values lifted from the Claude Design handoff (tokens/colors.css).
 */
export const colors = {
  // Base canvas (near-black charcoal)
  bg: '#0B0B0F',
  bgDeep: '#070709',

  // Glass overlays (translucent washes over backdrop blur)
  glass: 'rgba(255,255,255,0.05)',
  glassStrong: 'rgba(255,255,255,0.09)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassBorderStrong: 'rgba(255,255,255,0.18)',
  hairline: 'rgba(255,255,255,0.07)',
  // Web/weak-blur fallback base so glass never disappears
  glassFallback: 'rgba(22,22,28,0.74)',
  glassFallbackStrong: 'rgba(28,28,36,0.82)',

  // Solid surfaces
  surface: '#16161C',
  card: '#1A1A22',
  border: 'rgba(255,255,255,0.10)',

  // Text
  ink: '#F4F4F7',
  muted: '#A0A0AD',
  faint: '#6B6B79',
  inkOnAccent: '#0B1404', // near-black ink on lime / violet fills

  // Brand accents
  accent: '#C6F24E', // electric lime
  accentDim: '#A7D636',
  violet: '#7C5CFF',
  violetDeep: '#5B2FE0',
  blue: '#5B9DFF',
  warn: '#FFC24B',
  danger: '#FF5C6B',
  info: '#5B9DFF',

  // Glows
  accentGlow: 'rgba(198,242,78,0.42)',
  violetGlow: 'rgba(124,92,255,0.45)',
} as const;

/** Gradient stop pairs (always 135°, TL → BR). */
export const gradients = {
  hero: ['#C6F24E', '#AEE636'] as const, // lime — burn hero, primary CTAs
  violet: ['#8B5CFF', '#5B2FE0'] as const, // onboarding / brand surface
  upgrade: ['#8B5CFF', '#5B2FE0'] as const, // Pro / upgrade
  danger: ['#FF7A7A', '#FF4D6D'] as const,
  // Ambient glow blobs (violet-dominant)
  aurora1: ['#6A3DF0', 'rgba(106,61,240,0)'] as const, // deep violet
  aurora2: ['#7C5CFF', 'rgba(124,92,255,0)'] as const, // violet
  aurora3: ['#4A2BC0', 'rgba(74,43,192,0)'] as const, // indigo
};

/** Category palette (subscription type tags). */
export const CATEGORY_COLORS: Record<string, string> = {
  streaming: '#FF6B6B',
  music: '#C6F24E',
  telecom: '#5B9DFF',
  food: '#FF9F45',
  fitness: '#FF6FB5',
  productivity: '#A78BFA',
  ai: '#7C5CFF',
  shopping: '#FFC24B',
  news: '#A0A0AD',
  gaming: '#5BE584',
  education: '#5BB8FF',
  finance: '#FFD24B',
  other: '#7E8BA0',
};
