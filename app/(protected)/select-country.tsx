import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthHero } from '../../src/components/ui/AuthHero';
import { Dropdown } from '../../src/components/player/Dropdown';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { colors, radius, spacing, typography } from '../../src/theme';
import { COUNTRY_OPTIONS } from '../../src/constants/countries';
import { playerService } from '../../src/services/playerService';
import { subscriptionService } from '../../src/services/subscriptionService';
import { ApiError, SubscriptionPrices } from '../../src/types';

/**
 * One-time onboarding gate shown after login/registration when the player
 * hasn't set a country yet (see postAuthRoute.ts — that's the only trigger;
 * this screen doesn't re-check anything itself). Saves straight to
 * `Player.country` (the same field the sport-profile forms' own Country
 * field already writes to — see e.g. cricket.tsx), so a player who set it
 * there previously never sees this screen at all.
 */
export default function SelectCountryScreen() {
  const [country, setCountry] = useState('');
  const [prices, setPrices] = useState<SubscriptionPrices | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    subscriptionService.fetchPrices().then(setPrices).catch(() => undefined);
  }, []);

  const previewAmount = country && prices ? prices.prices[country] ?? prices.default_amount : prices?.default_amount;

  const handleContinue = async () => {
    if (!country) {
      setError('Please select your country to continue.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await playerService.updateProfile({ country });
      router.replace('/(protected)/(tabs)/home');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your country. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AuthHero
          title={'Where are\nyou playing?'}
          subtitle="Your country sets your subscription price — pick where you're based."
        />

        <View style={styles.sheet}>
          <ErrorBanner message={error} />

          <Dropdown
            label="Country"
            placeholder="Select your country"
            value={country}
            onChange={setCountry}
            options={COUNTRY_OPTIONS}
          />

          {country ? (
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Your subscription price</Text>
              {previewAmount !== undefined ? (
                <Text style={styles.priceValue}>
                  ${previewAmount.toFixed(2)} <Text style={styles.priceUnit}>/ year</Text>
                </Text>
              ) : (
                <ActivityIndicator color={colors.primary} style={styles.priceLoading} />
              )}
            </View>
          ) : null}

          <Button label="Continue" onPress={handleContinue} loading={isSaving} style={styles.continueButton} />
        </View>
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={styles.safeBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  safeBottom: {
    backgroundColor: colors.card,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    marginTop: -24,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  priceCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  priceValue: {
    ...typography.display,
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  priceUnit: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  priceLoading: {
    marginVertical: spacing.xs,
  },
  continueButton: {
    marginTop: spacing.sm,
  },
});
