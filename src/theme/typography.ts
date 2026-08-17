import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Type scale — Inter (400–900), per the AmaX restyle. Native RN needs a
 * static font family per weight (no variable-font axis), so each entry pairs
 * its `fontWeight` with the matching `Inter_*` family loaded in app/_layout.tsx.
 */
export const typography = {
  display: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: -0.5,
    color: colors.text,
  } as TextStyle,
  h1: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.text,
  } as TextStyle,
  h2: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.text,
  } as TextStyle,
  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.text,
  } as TextStyle,
  /** Card/section headers and tab labels — a step down from h3, callers
   * commonly override fontSize/fontWeight/color on top of this. */
  subtitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: colors.text,
  } as TextStyle,
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.text,
  } as TextStyle,
  bodyMuted: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textMuted,
  } as TextStyle,
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: colors.textMuted,
  } as TextStyle,
  button: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,
  overline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.primary,
  } as TextStyle,
} as const;
