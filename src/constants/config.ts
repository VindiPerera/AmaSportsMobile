import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Base URL for the Laravel API.
 * Resolution order: EXPO_PUBLIC_API_URL env var -> app.json extra.apiUrl -> localhost fallback.
 *
 * On Web browser, fallback to 127.0.0.1 if accessing via localhost to prevent LAN IP connection timeouts.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

function getApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://127.0.0.1:8000/api';
      }
    }
  }

  return envUrl ?? 'http://127.0.0.1:8000/api';
}

export const API_URL = getApiUrl();

export const API_TIMEOUT_MS = 15000;

export const STORAGE_KEYS = {
  authToken: 'auth_token',
  user: 'auth_user',
} as const;
