import { create } from 'zustand';
import { STORAGE_KEYS } from '../constants/config';
import { setUnauthorizedHandler } from '../services/apiClient';
import { authService } from '../services/authService';
import { secureStorage } from '../services/secureStorage';
import { ApiError } from '../types/api';
import {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
  VerifyOtpPayload,
} from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  /** True until the persisted session has been checked on app launch. */
  isHydrating: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ requiresVerification: boolean }>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<void>;
  resendOtp: (email: string) => Promise<string>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<string>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<string>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

async function persistSession(token: string, user: User) {
  await Promise.all([
    secureStorage.setItem(STORAGE_KEYS.authToken, token),
    secureStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user)),
  ]);
}

async function clearSession() {
  await Promise.all([
    secureStorage.removeItem(STORAGE_KEYS.authToken),
    secureStorage.removeItem(STORAGE_KEYS.user),
  ]);
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.firstFieldError ?? err.message;
  return 'Something went wrong. Please try again.';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isHydrating: true,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /** Restore a persisted session on cold start; wired to root layout on mount. */
  hydrate: async () => {
    try {
      const [token, userJson] = await Promise.all([
        secureStorage.getItem(STORAGE_KEYS.authToken),
        secureStorage.getItem(STORAGE_KEYS.user),
      ]);

      if (token && userJson) {
        set({ token, user: JSON.parse(userJson) as User, isAuthenticated: true });
      }
    } finally {
      set({ isHydrating: false });
    }
  },

  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authService.login(payload);
      await persistSession(token, user);
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err) });
      throw err;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register(payload);
      // Backend issues a token immediately but the account is unverified
      // until OTP confirmation — caller routes to the OTP screen for that case.
      if (result.token && result.user) {
        await persistSession(result.token, result.user);
        set({
          token: result.token,
          user: result.user,
          isAuthenticated: !!result.user.email_verified_at,
          isLoading: false,
        });
        return { requiresVerification: !result.user.email_verified_at };
      }
      set({ isLoading: false });
      return { requiresVerification: true };
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err) });
      throw err;
    }
  },

  verifyOtp: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authService.verifyOtp(payload);
      await persistSession(token, user);
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err) });
      throw err;
    }
  },

  resendOtp: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const message = await authService.resendOtp({ email });
      set({ isLoading: false });
      return message;
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err) });
      throw err;
    }
  },

  forgotPassword: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const message = await authService.forgotPassword(payload);
      set({ isLoading: false });
      return message;
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err) });
      throw err;
    }
  },

  resetPassword: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const message = await authService.resetPassword(payload);
      set({ isLoading: false });
      return message;
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err) });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // Best-effort — even if the network call fails, clear the local session.
      await authService.logout().catch(() => undefined);
    } finally {
      await clearSession();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  refreshProfile: async () => {
    const user = await authService.fetchProfile();
    await secureStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    set({ user });
  },
}));

// Force-logout whenever the API client sees a 401 (expired/invalid token).
setUnauthorizedHandler(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  clearSession();
});
