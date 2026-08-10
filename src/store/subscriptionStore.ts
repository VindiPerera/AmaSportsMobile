import { create } from 'zustand';
import { router } from 'expo-router';
import { setSubscriptionRequiredHandler } from '../services/apiClient';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionStatus } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO / TESTING BYPASS — set to `false` to restore real payment enforcement.
// When `true` the store returns a fake "active" subscription without hitting
// the API and the 402 paywall redirect is suppressed.
// ─────────────────────────────────────────────────────────────────────────────
const BYPASS_PAYWALL = true;

/** Hardcoded active status used when BYPASS_PAYWALL is enabled. */
const BYPASS_STATUS: SubscriptionStatus = {
  status: 'active',
  is_active: true,
  has_subscribed: true,
  expires_at: null,
};

interface SubscriptionState {
  status: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  /** Fetches once and caches — safe to call from every screen that needs it (Home, Profile, gates). */
  ensureLoaded: () => Promise<void>;
  /** Re-fetches regardless of cache — used after a payment completes and by pull-to-refresh. */
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: null,
  isLoading: false,
  error: null,

  ensureLoaded: async () => {
    if (get().status || get().isLoading) return;
    await get().refresh();
  },

  refresh: async () => {
    // BYPASS: skip the real API call and return a fake active subscription.
    if (BYPASS_PAYWALL) {
      set({ status: BYPASS_STATUS, isLoading: false, error: null });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const status = await subscriptionService.fetchStatus();
      set({ status, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Could not load subscription status.' });
    }
  },

  reset: () => set({ status: null, isLoading: false, error: null }),
}));

// A stale cached "active" status shouldn't keep gating screens open after the
// backend has rejected a write as expired — force a re-fetch so the paywall
// gates (sport-picker, Analysis) reflect reality on the very next check.
let redirectInFlight = false;
setSubscriptionRequiredHandler(() => {
  // BYPASS: suppress the 402 paywall redirect during testing.
  if (BYPASS_PAYWALL) return;
  useSubscriptionStore.setState({ status: null });
  if (redirectInFlight) return;
  redirectInFlight = true;
  router.push({ pathname: '/(protected)/subscription/paywall', params: { reason: 'expired' } });
  setTimeout(() => {
    redirectInFlight = false;
  }, 1000);
});
