import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';

interface AmaXLogoProps {
  /** Height in pixels (width auto-calculated based on aspect ratio) */
  size?: number;
  /** 'full' = complete AmaX logo with red Ama and stylized X. 'mark' = stylized X logo mark only. */
  variant?: 'full' | 'mark';
  /** Optional container style */
  style?: StyleProp<ImageStyle>;
}

const FULL_LOGO_ASPECT_RATIO = 958 / 329; // ~2.91
const MARK_LOGO_ASPECT_RATIO = 545 / 309; // ~1.76

/**
 * AmaX Official Business Logo component.
 * Uses high-resolution transparent assets generated directly from official brand identity.
 */
export function AmaXLogo({ size = 48, variant = 'full', style }: AmaXLogoProps) {
  if (variant === 'mark') {
    const width = size * MARK_LOGO_ASPECT_RATIO;
    return (
      <Image
        source={require('../../../assets/logo-mark.png')}
        style={[styles.image, { width, height: size }, style]}
        resizeMode="contain"
      />
    );
  }

  const width = size * FULL_LOGO_ASPECT_RATIO;
  return (
    <Image
      source={require('../../../assets/logo.png')}
      style={[styles.image, { width, height: size }, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
});
