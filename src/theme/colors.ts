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

  // Secondary "energy" accent — sport intensity, used sparingly for
  // highlights, badges, and gradient pairings against primary.
  energy: '#FF6B35',
  energyDark: '#E4501B',
  energyLight: '#FFE8DE',

  navy: '#0B1F3A',

  success: '#22C55E',
  successLight: '#DCFCE7',
  successBorder: '#BBF0D0',

  live: '#EF4444',
  liveLight: '#FEE2E2',
  liveBorder: '#FBD5D5',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  background: '#FFFFFF',
  card: '#F8FAFC',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  textInverse: '#FFFFFF',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gradient pairs — [start, end]. Angled diagonally (see components) for a
  // dynamic, athletic feel rather than a flat wash.
  gradientPrimary: ['#155EEF', '#0B1F3A'] as const,
  gradientEnergy: ['#FF6B35', '#EF4444'] as const,
} as const;

export type ColorToken = keyof typeof colors;
