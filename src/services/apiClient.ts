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
    'Content-Type': 'application/json',
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

    const message = data?.message ?? 'Something went wrong. Please try again.';
    const errors = data?.errors ?? null;

    return Promise.reject(new ApiError(message, status, errors));
  }
);
