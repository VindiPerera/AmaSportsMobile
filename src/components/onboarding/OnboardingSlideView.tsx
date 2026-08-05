import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide } from '../../constants/onboarding';
import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  slide: OnboardingSlide;
}

export function OnboardingSlideView({ slide }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name={slide.icon} size={64} color={colors.primary} />
      </View>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.description}>{slide.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconWrapper: {
    width: 160,
    height: 160,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.bodyMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
