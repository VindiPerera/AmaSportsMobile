/**
 * Single source of truth for "which screen does this sport's form live at".
 * Used by both the sport-picker (adding a new sport) and the Player Profile
 * hub (re-opening an already-submitted sport) so the two never drift.
 */
const DIRECT_ROUTES: Record<string, string> = {
  cricket: '/(protected)/player-profile/cricket',
  hockey: '/(protected)/player-profile/hockey',
  'base-ball': '/(protected)/player-profile/base-ball',
  netball: '/(protected)/player-profile/net-ball',
  kabadi: '/(protected)/player-profile/kabadi',
  judo: '/(protected)/player-profile/judo',
  basketball: '/(protected)/player-profile/basketball',
  football: '/(protected)/player-profile/football',
  rugby: '/(protected)/player-profile/rugby',
  boxing: '/(protected)/player-profile/boxing',
  karate: '/(protected)/player-profile/karate',
  chess: '/(protected)/player-profile/chess',
  athletics: '/(protected)/player-profile/athletics',
  swimming: '/(protected)/player-profile/swimming',
  volleyball: '/(protected)/player-profile/volleyball',
  'beach-volleyball': '/(protected)/player-profile/beach-volleyball',
  elle: '/(protected)/player-profile/elle',
};

/** Tennis/Badminton/Table Tennis share one form screen, disambiguated by a `sport` param. */
const RACKET_SPORT_SLUGS = new Set(['tennis', 'badminton', 'table-tennis']);

export interface RouteTarget {
  pathname: string;
  params?: Record<string, string>;
}

/** Resolves a sport to its form route, or the "coming soon" placeholder if it doesn't have one yet. */
export function resolveSportRoute(sport: { slug: string; name: string }): RouteTarget {
  if (DIRECT_ROUTES[sport.slug]) {
    return { pathname: DIRECT_ROUTES[sport.slug] };
  }
  if (RACKET_SPORT_SLUGS.has(sport.slug)) {
    return { pathname: '/(protected)/player-profile/racket-sport', params: { sport: sport.slug } };
  }
  return { pathname: '/(protected)/player-profile/coming-soon', params: { sport: sport.name } };
}
