import { Ionicons } from '@expo/vector-icons';

/** Best-effort icon per sport slug — Ionicons doesn't cover every sport, so this falls back sensibly. */
const SPORT_ICON_MAP: Partial<Record<string, keyof typeof Ionicons.glyphMap>> = {
  cricket: 'baseball-outline',
  hockey: 'golf-outline',
  football: 'football-outline',
  basketball: 'basketball-outline',
  tennis: 'tennisball-outline',
  'table-tennis': 'tennisball-outline',
  swimming: 'water-outline',
  boxing: 'fitness-outline',
  chess: 'grid-outline',
  athletics: 'walk-outline',
  badminton: 'tennisball-outline',
  'base-ball': 'baseball-outline',
  netball: 'basketball-outline',
  kabadi: 'people-outline',
  judo: 'body-outline',
  rugby: 'american-football-outline',
  karate: 'body-outline',
  volleyball: 'basketball-outline',
  'beach-volleyball': 'sunny-outline',
  elle: 'baseball-outline',
};

export function sportIconFor(slug: string): keyof typeof Ionicons.glyphMap {
  return SPORT_ICON_MAP[slug] ?? 'trophy-outline';
}
