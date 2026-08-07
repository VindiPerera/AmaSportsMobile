/**
 * Brand color tokens.
 * Keep all raw hex values confined to this file — every other module should
 * reference `colors.*` (or the semantic aliases below) instead of hex codes.
 *
 * Background stays pure white (#FFFFFF) throughout the app per brand — all
 * "color" comes from accents, gradients, and imagery on top of that white,
 * not from tinted page backgrounds.
 */
export const colors = {
  primary: '#155EEF',
  primaryDark: '#0E42B3',
  primaryLight: '#E8EFFE',

  // Secondary "energy" accent — sport intensity, highlights & badges
  energy: '#FF6B35',
  energyDark: '#E4501B',
  energyLight: '#FFE8DE',

  navy: '#0B1F3A',
  navyDark: '#0B1E3D',

  success: '#22C55E',
  successLight: '#DCFCE7',
  successBorder: '#BBF0D0',

  live: '#EF4444',
  liveLight: '#FEE2E2',
  liveBorder: '#FBD5D5',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  background: '#F8FAFC',
  card: '#FFFFFF',
  cardSubtle: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  textInverse: '#FFFFFF',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gradient pairs — [start, end]
  gradientPrimary: ['#0B1E3D', '#1B3A6B'] as const,
  gradientHero: ['#0B1E3D', '#1B3A6B'] as const,
  gradientDark: ['#071224', '#0F264A'] as const,
  gradientEnergy: ['#FF6B35', '#EF4444'] as const,
  gradientAccent: ['#155EEF', '#004EEB'] as const,
} as const;

export type ColorToken = keyof typeof colors;
