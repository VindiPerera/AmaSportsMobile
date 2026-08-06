import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme';

interface LogoProps {
  size?: number;
  /** "mark" = icon badge only. "full" = badge + wordmark, for headers. */
  variant?: 'mark' | 'full';
}

/**
 * Brand mark: a diagonal navy→primary gradient badge with a sport glyph.
 * Swap for a real logo asset later — keep the same footprint so layouts
 * don't shift.
 */
export function Logo({ size = 96, variant = 'mark' }: LogoProps) {
  const badge = (
    <LinearGradient
      colors={colors.gradientPrimary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size * 0.28 },
        shadows.md,
      ]}
    >
      <Ionicons name="flash" size={size * 0.5} color={colors.white} />
    </LinearGradient>
  );

  if (variant === 'mark') return badge;

  return (
    <View style={styles.fullRow}>
      {badge}
      <Text style={[styles.wordmark, { fontSize: size * 0.34 }]}>AmaSports</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
});
