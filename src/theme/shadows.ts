import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

/**
 * Elevation presets. iOS/Android use native shadow props; web falls back to
 * boxShadow since RN Web doesn't render shadowColor/shadowOffset reliably.
 */
function shadow(offsetY: number, opacity: number, radius: number, elevation: number): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${radius}px rgba(15, 23, 42, ${opacity})`,
    };
  }

  return {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

export const shadows = {
  none: {},
  sm: shadow(2, 0.06, 6, 2),
  md: shadow(6, 0.08, 16, 6),
  lg: shadow(12, 0.12, 28, 12),
} as const;

export type ShadowToken = keyof typeof shadows;
