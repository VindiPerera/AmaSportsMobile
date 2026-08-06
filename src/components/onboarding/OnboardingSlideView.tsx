import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide } from '../../constants/onboarding';
import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  slide: OnboardingSlide;
}

const ACCENT_TINTS: Record<OnboardingSlide['accent'], { icon: string; ring: string; tint: string }> = {
  primary: { icon: colors.primary, ring: colors.primaryLight, tint: colors.primaryLight },
  energy: { icon: colors.energy, ring: colors.energyLight, tint: colors.energyLight },
  live: { icon: colors.live, ring: colors.liveLight, tint: colors.liveLight },
};

export function OnboardingSlideView({ slide }: Props) {
  const accent = ACCENT_TINTS[slide.accent];

  return (
    <View style={styles.container}>
      <View style={[styles.outerRing, { borderColor: accent.ring }]}>
        <View style={[styles.iconWrapper, { backgroundColor: accent.tint }]}>
          <Ionicons name={slide.icon} size={56} color={accent.icon} />
        </View>
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
  outerRing: {
    width: 196,
    height: 196,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  iconWrapper: {
    width: 152,
    height: 152,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
