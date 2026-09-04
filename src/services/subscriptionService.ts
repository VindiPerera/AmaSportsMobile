import { apiClient } from './apiClient';
import { ApiSuccessResponse, SubscriptionOrder, SubscriptionPrices, SubscriptionStatus } from '../types';

export const subscriptionService = {
  /** Drives the Add Sport / Analysis paywall gate + the Profile/Home status displays. */
  async fetchStatus() {
    const { data } = await apiClient.get<ApiSuccessResponse<SubscriptionStatus>>(
      '/player/subscription-status'
    );
    return data.data;
  },

  /** Every admin-configured country price + the default — drives the price
   * preview on the country-selection screen (see select-country.tsx). */
  async fetchPrices() {
    const { data } = await apiClient.get<ApiSuccessResponse<SubscriptionPrices>>(
      '/subscription-prices'
    );
    return data.data;
  },

  /** Starts (or renews) the $10/year subscription — open `approve_url` in an in-app browser. */
  async createOrder() {
    const { data } = await apiClient.post<ApiSuccessResponse<SubscriptionOrder>>(
      '/subscriptions/create-order'
    );
    return data.data;
  },

  /**
   * Starts the one-time free trial (Phase 8) — no PayPal step, unlocks
   * immediately. Only reachable when `status.trial_eligible` is true; the
   * backend re-enforces eligibility regardless.
   */
  async startTrial() {
    const { data } = await apiClient.post<ApiSuccessResponse<SubscriptionStatus>>(
      '/subscriptions/start-trial'
    );
    return data.data;
  },
};
