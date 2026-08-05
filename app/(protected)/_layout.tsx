import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

/**
 * Route guard for the whole authenticated app. Any screen nested under
 * `(protected)` is unreachable unless `isAuthenticated` is true — this is
 * the single choke point new authenticated features (teams, analytics,
 * live scores, etc.) will automatically inherit.
 */
export default function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
