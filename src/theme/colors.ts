/**
 * Brand color tokens — AmaX restyle, phase 1 (Claude Design handoff,
 * project "AmaX Restyle").
 * - Primary: Navy/charcoal (was AmaX red) — the primary action color now.
 * - Energy / Accent: Lime-gold (was amber) — chips, highlights, focus states.
 * - Red is kept but narrowed to one job: the LIVE badge and score alerts.
 * Token keys are unchanged from the original AmaX palette so nothing
 * downstream breaks — only values moved.
 */
export const colors = {
  // Primary — navy/charcoal, now the primary action color
  primary: '#111827',
  primaryDark: '#030712',
  primaryLight: '#F1F1EC',

  // Secondary — lime-gold accent (chips, highlights, focus rings)
  energy: '#D7FF3F',
  energyDark: '#A6D90A',
  energyLight: '#F5FFDB',

  // Dark Charcoal / Navy — unchanged, same family as primary
  navy: '#111827',
  navyDark: '#030712',

  success: '#22C55E',
  successLight: '#DCFCE7',
  successBorder: '#BBF0D0',

  // Reserved for LIVE badges / score alerts only — unchanged
  live: '#E31B23',
  liveLight: '#FFE4E6',
  liveBorder: '#FECDD3',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  background: '#F7F7F2',
  card: '#FFFFFF',
  cardSubtle: '#F1F1EC',
  border: '#E4E4DC',
  borderStrong: '#D3D3C7',

  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  textInverse: '#FFFFFF',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gradient pairs — [start, end]
  gradientPrimary: ['#111827', '#030712'] as const,
  gradientHero: ['#1F2937', '#111827'] as const,
  gradientDark: ['#111827', '#030712'] as const,
  gradientEnergy: ['#D7FF3F', '#A6D90A'] as const,
  gradientAccent: ['#111827', '#D7FF3F'] as const,
} as const;

export type ColorToken = keyof typeof colors;
