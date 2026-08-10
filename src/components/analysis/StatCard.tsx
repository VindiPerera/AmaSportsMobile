import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

interface StatCardProps {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'energy' | 'default';
  /** Grid cards (Overview) size themselves via flexBasis from the parent's flexWrap row; row cards (stat rows) stretch to fill. */
  variant?: 'grid' | 'row';
}

const TONE_COLOR: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: colors.primary,
  energy: colors.energy,
  default: colors.textMuted,
};

/** Large-number-over-label stat tile, used across the Overview grid and the Bowling stat row. */
export function StatCard({ label, value, icon, tone = 'default', variant = 'grid' }: StatCardProps) {
  const accent = TONE_COLOR[tone];

  return (
    <View style={[styles.card, variant === 'row' && styles.cardRow]}>
      {icon ? (
        <View style={[styles.iconWrapper, { backgroundColor: `${accent}15` }]}>
          <Ionicons name={icon} size={15} color={accent} />
        </View>
      ) : null}
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs + 4,
    paddingHorizontal: spacing.xs + 4,
    alignItems: 'flex-start',
    gap: 2,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardRow: {
    flex: 1,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
