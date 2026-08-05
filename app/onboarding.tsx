import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { router } from 'expo-router';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { Button } from '../src/components/ui/Button';
import { SlideDots } from '../src/components/onboarding/SlideDots';
import { OnboardingSlideView } from '../src/components/onboarding/OnboardingSlideView';
import { ONBOARDING_SLIDES } from '../src/constants/onboarding';
import { colors, spacing, typography } from '../src/theme';
import { useOnboardingStore } from '../src/store/onboardingStore';

export default function OnboardingScreen() {
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const completeOnboarding = useOnboardingStore((s) => s.complete);

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
    pagerRef.current?.setPage(activeIndex + 1);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.topRow}>
        <View />
        {!isLastSlide && (
          <Text style={styles.skipText} onPress={goToAuth} suppressHighlighting>
            Skip
          </Text>
        )}
      </View>

      <PagerView
        ref={pagerRef}
        style={[styles.pager, { width }]}
        initialPage={0}
        onPageSelected={(e) => setActiveIndex(e.nativeEvent.position)}
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <View key={slide.id} style={styles.page}>
            <OnboardingSlideView slide={slide} />
          </View>
        ))}
      </PagerView>

      <View style={styles.footer}>
        <SlideDots count={ONBOARDING_SLIDES.length} activeIndex={activeIndex} />
        <Button
          label={isLastSlide ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  pager: {
    flex: 1,
    marginHorizontal: -spacing.lg,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
});
