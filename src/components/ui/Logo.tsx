import React from 'react';
import { ImageStyle, StyleProp } from 'react-native';
import { AmaXLogo } from './AmaXLogo';

interface LogoProps {
  /** Logo height or size metric */
  size?: number;
  /** "full" = complete AmaX logo with red Ama and stylized X. "mark" = stylized X logo mark only. */
  variant?: 'mark' | 'full';
  style?: StyleProp<ImageStyle>;
}

/**
 * Brand logo wrapper for the AmaX business logo.
 */
export function Logo({ size = 48, variant = 'full', style }: LogoProps) {
  return <AmaXLogo size={size} variant={variant} style={style} />;
}


