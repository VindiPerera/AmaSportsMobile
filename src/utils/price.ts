const SYMBOLS: Record<string, string> = {
  USD: '$',
  LKR: 'Rs. ',
  GBP: '£',
  EUR: '€',
  AUD: 'A$',
};

/**
 * Formats a payment amount in whatever currency the backend charges in
 * (PAYHERE_CURRENCY) — e.g. "$10.00" or "Rs. 3,000.00". Pass `decimals: 0`
 * for compact badges.
 */
export function formatPrice(amount: number, currency: string | null | undefined = 'USD', decimals = 2): string {
  const code = (currency || 'USD').toUpperCase();
  const symbol = SYMBOLS[code] ?? `${code} `;
  const value = amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${symbol}${value}`;
}
