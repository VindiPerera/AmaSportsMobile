import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { OnboardingSlide } from '../../constants/onboarding';
import { colors, radius, spacing } from '../../theme';
import { StripedBackground } from './StripedBackground';

interface Props {
  slide: OnboardingSlide;
}

/**
 * One onboarding pager page — diagonal-stripe backdrop (also the fallback
 * if a photo is slow to load) with the slide artwork inset as a rounded
 * frame. `resizeMode="contain"` so the illustration is never cropped —
 * these are full character/scene compositions, not backgrounds meant to
 * bleed off-frame. Headline/description/dots/CTA live in the shared
 * bottom-sheet overlay in onboarding.tsx so they update instantly instead
 * of scrolling per-slide.
 */
export function OnboardingSlideView({ slide }: Props) {
  return (
    <View style={styles.container}>
      <StripedBackground style={StyleSheet.absoluteFill} />

      <View style={styles.photoFrame}>
        <Image source={slide.image} style={styles.photo} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  photoFrame: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
    bottom: 240,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.navyDark,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});
