import Constants from 'expo-constants';

/**
 * Base URL for the Laravel API.
 * Resolution order: EXPO_PUBLIC_API_URL env var -> app.json extra.apiUrl -> localhost fallback.
 *
 * NOTE: On a physical device or Android emulator, `localhost` will NOT reach
 * your machine. Use your LAN IP (e.g. http://192.168.1.10:8000/api) or the
 * Android emulator alias http://10.0.2.2:8000/api instead, via .env.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://127.0.0.1:8000/api';

export const API_TIMEOUT_MS = 15000;

export const STORAGE_KEYS = {
  authToken: 'auth_token',
  user: 'auth_user',
} as const;
