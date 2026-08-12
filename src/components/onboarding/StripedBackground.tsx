import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

interface Props {
  style?: StyleProp<ViewStyle>;
}

/**
 * Diagonal-stripe placeholder pattern for the onboarding hero — matches the
 * AmaX Restyle mockup's `repeating-linear-gradient(45deg, ...)` panel,
 * reimplemented in SVG so it renders identically on native and web (CSS
 * repeating-linear-gradient is web-only).
 */
export function StripedBackground({ style }: Props) {
  return (
    <Svg width="100%" height="100%" style={style}>
      <Defs>
        <Pattern id="diagonalStripes" width={24} height={24} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Rect width={24} height={24} fill="#1c2434" />
          <Rect width={12} height={24} fill="#151b28" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#diagonalStripes)" />
    </Svg>
  );
}
