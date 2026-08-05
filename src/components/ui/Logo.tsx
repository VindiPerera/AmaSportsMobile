import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';

interface LogoProps {
  size?: number;
}

/**
 * Placeholder brand mark (letter badge on navy). Swap for the real logo
 * asset once available — keep the same footprint so layouts don't shift.
 */
export function Logo({ size = 96 }: LogoProps) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: radius.xl },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.42 }]}>AS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
