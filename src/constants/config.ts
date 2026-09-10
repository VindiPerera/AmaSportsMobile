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

  // An explicit override always wins — otherwise EXPO_PUBLIC_API_URL would
  // be silently ignored whenever the web preview happens to be served from
  // localhost (e.g. pointing at a hosted backend while testing web builds).
  if (envUrl) {
    return envUrl;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://127.0.0.1:8000/api';
      }
    }
  }

  return 'http://127.0.0.1:8000/api';
}

export const API_URL = getApiUrl();

// The Laravel backend's web root (API_URL minus the trailing /api), used to
// link out to server-rendered pages like the public Privacy Policy that
// live outside the /api surface — see routes/web.php's `privacy-policy`
// route.
export const WEB_URL = API_URL.replace(/\/api\/?$/, '');

export const PRIVACY_POLICY_URL = `${WEB_URL}/privacy-policy`;

export const TERMS_URL = `${WEB_URL}/terms`;

export const API_TIMEOUT_MS = 15000;

export const STORAGE_KEYS = {
  authToken: 'auth_token',
  user: 'auth_user',
} as const;
