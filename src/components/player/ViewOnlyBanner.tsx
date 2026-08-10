import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

/**
 * Shown at the top of a sport profile screen when it was opened from the
 * Home dashboard (read-only quick view). Editing only happens from the
 * Profile tab, which opens the same screen without `mode=view`.
 */
export function ViewOnlyBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="eye-outline" size={14} color={colors.primary} />
      <Text style={styles.text}>Viewing only — go to the Profile tab to edit.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
});
