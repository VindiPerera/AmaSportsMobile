/**
 * Brand color tokens based on the official AmaX business logo identity.
 * - Primary: AmaX Vibrant Red (#E31B23)
 * - Energy / Accent: AmaX Gold Yellow (#F59E0B)
 * - Charcoal / Navy: AmaX Dark Gray (#111827)
 */
export const colors = {
  // Primary AmaX Red Palette
  primary: '#E31B23',
  primaryDark: '#B91C1C',
  primaryLight: '#FFF1F2',

  // Secondary AmaX Energy Accent — Gold Yellow from logo X mark
  energy: '#F59E0B',
  energyDark: '#D97706',
  energyLight: '#FEF3C7',

  // Dark Charcoal / Navy from logo X diagonal stroke
  navy: '#111827',
  navyDark: '#030712',

  success: '#22C55E',
  successLight: '#DCFCE7',
  successBorder: '#BBF0D0',

  live: '#E31B23',
  liveLight: '#FFE4E6',
  liveBorder: '#FECDD3',

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
  gradientPrimary: ['#E31B23', '#B91C1C'] as const,
  gradientHero: ['#1F2937', '#111827'] as const,
  gradientDark: ['#111827', '#030712'] as const,
  gradientEnergy: ['#F59E0B', '#D97706'] as const,
  gradientAccent: ['#E31B23', '#F59E0B'] as const,
} as const;

export type ColorToken = keyof typeof colors;
