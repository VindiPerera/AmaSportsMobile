import { playerService } from '../services/playerService';

/**
 * Where to send the player right after a successful login/registration —
 * the country-selection screen if they've never set one (see
 * select-country.tsx), otherwise wherever the caller would normally go.
 * Shared by login.tsx and register.tsx so the two don't drift on this check.
 *
 * A fetch failure falls through to `fallback` rather than blocking on it —
 * this is an onboarding nicety, not something that should ever strand a
 * player who just successfully authenticated.
 */
export async function resolvePostAuthRoute(fallback: string): Promise<string> {
  try {
    const profile = await playerService.fetchProfile();
    if (!profile.country) return '/(protected)/select-country';
  } catch {
    // Fall through to `fallback`.
  }
  return fallback;
}
