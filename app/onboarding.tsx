import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../src/components/ui/Button';
import { SlideDots } from '../src/components/onboarding/SlideDots';
import { OnboardingSlideView } from '../src/components/onboarding/OnboardingSlideView';
import { ONBOARDING_SLIDES } from '../src/constants/onboarding';
import { colors, radius, spacing, typography } from '../src/theme';
import { useOnboardingStore } from '../src/store/onboardingStore';

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const completeOnboarding = useOnboardingStore((s) => s.complete);

  const currentSlide = ONBOARDING_SLIDES[activeIndex];
  const isLastSlide = activeIndex === ONBOARDING_SLIDES.length - 1;

  const goToAuth = async () => {
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (isLastSlide) {
      goToAuth();
      return;
    }
    const nextIndex = activeIndex + 1;
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    setActiveIndex(nextIndex);
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  };

  return (
    <View style={styles.root}>
      {/* Dark hero fills the screen — light status bar icons read correctly on it. */}
      <StatusBar style="light" />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={StyleSheet.absoluteFill}
        contentContainerStyle={styles.pagerContent}
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <View key={slide.id} style={{ width, height: '100%' }}>
            <OnboardingSlideView slide={slide} />
          </View>
        ))}
      </ScrollView>

      {/* Bottom sheet overlay — shared across slides, updates instantly with activeIndex
          instead of scrolling per-slide (dots/CTA never need to stay in sync mid-swipe). */}
      <SafeAreaView edges={['bottom']} style={styles.sheet} pointerEvents="box-none">
        <Text style={styles.sheetTitle}>
          {currentSlide.headline}{' '}
          <Text style={styles.sheetTitleAccent}>{currentSlide.headlineAccent}</Text>
        </Text>
        <Text style={styles.sheetDescription}>{currentSlide.description}</Text>

        <View style={styles.footer}>
          <SlideDots count={ONBOARDING_SLIDES.length} activeIndex={activeIndex} />
          <Button
            label={isLastSlide ? "LET'S GO" : 'NEXT'}
            variant="primary"
            onPress={handleNext}
            style={styles.pillButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  pagerContent: {
    height: '100%',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  sheetTitle: {
    ...typography.h1,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
  },
  sheetTitleAccent: {
    backgroundColor: colors.energy,
    color: colors.navy,
    borderRadius: radius.xs,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  sheetDescription: {
    ...typography.bodyMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  pillButton: {
    borderRadius: radius.full,
    height: 54,
  },
});
