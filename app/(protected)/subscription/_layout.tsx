import { Stack } from 'expo-router';
import { colors } from '../../../src/theme';

/** Stack for the subscribe/renew paywall, pushed from Add Sport, Analysis, or Profile's "Manage Subscription". */
export default function SubscriptionStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="paywall" options={{ title: 'Subscription' }} />
    </Stack>
  );
}
