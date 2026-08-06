import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { UserRole } from '../../types/auth';

interface RoleOption {
  value: UserRole;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'student', label: 'Student / Athlete', icon: 'body-outline' },
  { value: 'coach', label: 'Coach', icon: 'clipboard-outline' },
];

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>I am a</Text>
      <View style={styles.row}>
        {ROLE_OPTIONS.map((option) => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.option, isSelected && styles.optionSelected, isSelected && shadows.sm]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              {isSelected ? (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={11} color={colors.white} />
                </View>
              ) : null}
              <Ionicons
                name={option.icon}
                size={22}
                color={isSelected ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 76,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    position: 'relative',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: colors.primary,
  },
});
