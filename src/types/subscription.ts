/** Mirrors GET /player/subscription-status (Api\SubscriptionController::status). */
export type SubscriptionStatusValue = 'none' | 'pending' | 'active' | 'expired' | 'cancelled';

export interface SubscriptionStatus {
  has_subscribed: boolean;
  status: SubscriptionStatusValue;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  /** Only set while `is_active` is true. */
  days_remaining: number | null;
  /** `is_active` and `days_remaining <= 30`. */
  expiring_soon: boolean;
  amount: number;
  currency: string;
}

/** POST /subscriptions/create-order response. */
export interface SubscriptionOrder {
  subscription_id: number;
  order_id: string;
  approve_url: string;
}
