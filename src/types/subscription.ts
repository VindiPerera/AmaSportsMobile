/** Mirrors GET /player/subscription-status (Api\SubscriptionController::status). */
export type SubscriptionStatusValue = 'none' | 'pending' | 'active' | 'expired' | 'cancelled';

export interface SubscriptionStatus {
  has_subscribed: boolean;
  status: SubscriptionStatusValue;
  is_active: boolean;
  /** Whether the *current* active subscription is the free trial (Phase 8). False whenever `is_active` is false. */
  is_trial: boolean;
  /** Whether this player can still start the free trial — i.e. `trial_used_at IS NULL` on the backend. */
  trial_eligible: boolean;
  starts_at: string | null;
  expires_at: string | null;
  /** Only set while `is_active` is true. */
  days_remaining: number | null;
  /** `is_active` and `days_remaining <= 30`. */
  expiring_soon: boolean;
  /** What the reported subscription row was charged — 0 for the free trial. */
  amount: number;
  currency: string;
  /** What the 1-year plan costs this player right now (their country's price) — use this for any price shown on a buy/upgrade/renew button. */
  plan_amount: number;
  /** Whether the 1-year plan can be bought now: nothing active, on the free trial (upgrade), or a paid year in its last 30 days (renew early). */
  can_purchase: boolean;
}

/** POST /subscriptions/create-order response. */
export interface SubscriptionOrder {
  subscription_id: number;
  order_id: string;
  approve_url: string;
}

/**
 * GET /subscription-prices response — every admin-configured country price
 * (see Admin\SubscriptionPriceController), keyed by the exact country name
 * from constants/countries.ts, plus the default any other country falls
 * back to. Drives the price preview on the country-selection screen.
 */
export interface SubscriptionPrices {
  default_amount: number;
  currency: string;
  prices: Record<string, number>;
}
