import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Type scale. Font family is left as the system default for now; swap
 * `fontFamily` here once brand fonts are added to `assets/fonts`.
 */
export const typography = {
  display: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: -0.5,
    color: colors.text,
  } as TextStyle,
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    color: colors.text,
  } as TextStyle,
  h2: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.text,
  } as TextStyle,
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.text,
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.text,
  } as TextStyle,
  bodyMuted: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textMuted,
  } as TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: colors.textMuted,
  } as TextStyle,
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,
  overline: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.primary,
  } as TextStyle,
} as const;
