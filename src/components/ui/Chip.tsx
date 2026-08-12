import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  /** Optional leading glyph — render an Ionicons element sized ~14-16px. */
  icon?: React.ReactNode;
  /**
   * Active-state color scheme. `energy` (lime fill, default) reads as a
   * filter/toggle — used for format/live filters. `primary` (navy fill,
   * white text) reads as a selector — used for the Home sport switcher.
   */
  tone?: 'energy' | 'primary';
  style?: ViewStyle;
}

/** Filter/category pill — active = filled per `tone`, inactive = white + border. */
export function Chip({ label, active = false, onPress, icon, tone = 'energy', style }: ChipProps) {
  const activeStyle = tone === 'primary' ? styles.chipActivePrimary : styles.chipActiveEnergy;
  const activeLabelStyle = tone === 'primary' ? styles.labelActivePrimary : styles.labelActiveEnergy;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        active ? activeStyle : styles.chipInactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.label, active ? activeLabelStyle : styles.labelInactive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 5,
    paddingHorizontal: spacing.md,
  },
  chipActiveEnergy: {
    backgroundColor: colors.energy,
    borderWidth: 1,
    borderColor: colors.transparent,
  },
  chipActivePrimary: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  labelActiveEnergy: {
    color: colors.navy,
  },
  labelActivePrimary: {
    color: colors.white,
  },
  labelInactive: {
    color: colors.textMuted,
  },
});
