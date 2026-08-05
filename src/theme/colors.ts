/**
 * Brand color tokens.
 * Keep all raw hex values confined to this file — every other module should
 * reference `colors.*` (or the semantic aliases below) instead of hex codes.
 */
export const colors = {
  primary: '#155EEF',
  primaryDark: '#0E42B3',
  primaryLight: '#E8EFFE',

  navy: '#0B1F3A',

  success: '#22C55E',
  successLight: '#DCFCE7',

  live: '#EF4444',
  liveLight: '#FEE2E2',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  background: '#FFFFFF',
  card: '#F8FAFC',
  border: '#E2E8F0',

  text: '#0F172A',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
