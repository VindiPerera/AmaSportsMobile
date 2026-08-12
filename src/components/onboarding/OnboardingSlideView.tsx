import React from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide } from '../../constants/onboarding';
import { colors, radius, shadows, spacing, typography } from '../../theme';

interface Props {
  slide: OnboardingSlide;
}

export function OnboardingSlideView({ slide }: Props) {
  const { height: screenHeight } = useWindowDimensions();
  const cardHeight = Math.min(screenHeight * 0.54, 420);

  return (
    <View style={styles.container}>
      {/* Immersive Light Hero Photo Card */}
      <View style={[styles.heroCard, { height: cardHeight }, shadows.md]}>
        <Image source={{ uri: slide.imageUrl }} style={styles.heroImage} resizeMode="cover" />

        {/* Soft Multi-Stop Linear Gradient Overlay */}
        <LinearGradient
          colors={[
            'rgba(15, 23, 42, 0.25)',
            'rgba(15, 23, 42, 0.45)',
            'rgba(15, 23, 42, 0.85)',
          ]}
          style={styles.gradientOverlay}
        />

        {/* Top Brand Badge */}
        <View style={styles.badgeWrapper}>
          <View style={styles.badgePill}>
            <Ionicons name={slide.icon} size={13} color={colors.white} />
            <Text style={styles.badgeText}>{slide.badgeText}</Text>
          </View>
        </View>

        {/* Center Overlaid Hero Title & Tagline (Matches Reference UI) */}
        <View style={styles.centerOverlayContent}>
          <Text style={styles.heroTitle}>{slide.title}</Text>
          <Text style={styles.heroSubtitle}>{slide.subtitle}</Text>
        </View>
      </View>

      {/* Light Theme Footer Description */}
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>{slide.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  heroCard: {
    width: '100%',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.cardSubtle,
    position: 'relative',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  badgeWrapper: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    zIndex: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  centerOverlayContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  heroTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  descriptionBox: {
    width: '100%',
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  descriptionText: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
