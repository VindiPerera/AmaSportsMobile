import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

/**
 * Auth group layout. If the user is already authenticated, bounce them
 * straight to the protected app instead of showing login/register again.
 */
export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="verify-otp" />
    </Stack>
  );
}
