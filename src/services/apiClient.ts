import axios from 'axios';
import type { AxiosError, AxiosInstance } from 'axios';
import { API_TIMEOUT_MS, API_URL, STORAGE_KEYS } from '../constants/config';
import { ApiError, ApiErrorResponse } from '../types/api';
import { secureStorage } from './secureStorage';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    // Deliberately no default Content-Type here. Axios sets
    // `application/json` automatically for plain object payloads, and
    // `multipart/form-data; boundary=...` automatically for FormData bodies
    // (see playerService.updateProfile). A hardcoded default of
    // 'application/json' would make axios JSON.stringify every FormData
    // body instead — silently turning uploaded photos into the string
    // "[object Object]" and failing Laravel's `image` validation with a 422.
  },
});

/** Attach the bearer token (if present) to every outgoing request. */
apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItem(STORAGE_KEYS.authToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Optional hook the auth store wires up to force-logout on a 401. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/**
 * Optional hook the root layout wires up to redirect to the paywall on a
 * 402 `subscription_required` — fired by any sport-profile write or the
 * Analysis endpoints once a subscription has lapsed (EnsureActiveSubscription
 * on the backend). Centralized here instead of duplicated in ~19 nearly
 * identical sport-profile screens' submit handlers.
 */
let onSubscriptionRequired: (() => void) | null = null;
export function setSubscriptionRequiredHandler(handler: (() => void) | null) {
  onSubscriptionRequired = handler;
}

/** Normalize every failure into an ApiError so screens never touch AxiosError directly. */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      return Promise.reject(
        new ApiError('Network error. Please check your internet connection and try again.')
      );
    }

    const { status, data } = error.response;

    if (status === 401) {
      onUnauthorized?.();
    }

    if (status === 402 && data?.error_code === 'subscription_required') {
      onSubscriptionRequired?.();
    }

    const message = data?.message ?? 'Something went wrong. Please try again.';
    const errors = data?.errors ?? null;

    return Promise.reject(new ApiError(message, status, errors, data?.error_code ?? null));
  }
);
