import { create } from 'zustand';
import { router } from 'expo-router';
import { setSubscriptionRequiredHandler } from '../services/apiClient';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionStatus } from '../types';

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
// backend has rejected a write as needing a subscription — force a re-fetch so
// the paywall (which reads status.has_subscribed itself to tell "never
// subscribed" from "lapsed") reflects reality on the very next check.
let redirectInFlight = false;
setSubscriptionRequiredHandler(() => {
  useSubscriptionStore.setState({ status: null });
  if (redirectInFlight) return;
  redirectInFlight = true;
  router.push('/(protected)/subscription/paywall');
  setTimeout(() => {
    redirectInFlight = false;
  }, 1000);
});
