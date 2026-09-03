/** `YYYY-MM-DD` — what the API and the date pickers exchange. */
export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Auto-calculates age from a `YYYY-MM-DD` born date; the player can still override it manually. */
export function calculateAge(bornIsoDate: string | null | undefined): number | null {
  if (!bornIsoDate) return null;
  const born = new Date(bornIsoDate);
  if (Number.isNaN(born.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return age >= 0 ? age : null;
}

export function formatBornDate(bornIsoDate: string | null | undefined): string {
  if (!bornIsoDate) return 'N/A';
  const date = new Date(bornIsoDate);
  if (Number.isNaN(date.getTime())) return bornIsoDate;

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDetailedAge(bornIsoDate: string | null | undefined, fallbackAge?: number | string | null): string {
  if (!bornIsoDate) {
    return fallbackAge ? `${fallbackAge} yrs` : 'N/A';
  }
  const born = new Date(bornIsoDate);
  if (Number.isNaN(born.getTime())) {
    return fallbackAge ? `${fallbackAge} yrs` : 'N/A';
  }

  const today = new Date();
  let years = today.getFullYear() - born.getFullYear();

  // Find last birthday
  const lastBirthday = new Date(today.getFullYear(), born.getMonth(), born.getDate());
  if (today < lastBirthday) {
    years -= 1;
    lastBirthday.setFullYear(today.getFullYear() - 1);
  }

  const diffTime = Math.abs(today.getTime() - lastBirthday.getTime());
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return `${years}y ${days}d`;
}

/** Recent Matches only ever keeps this many — adding an 11th drops the
 * oldest one. */
export const MAX_RECENT_MATCHES = 10;

/**
 * Newest match first (today's match before yesterday's), capped to the 10
 * most recent — adding an 11th silently drops the oldest, not the newest.
 * Used both when a match is added (see RecentMatchTable) and when it's
 * displayed (see CricketPlayerDetailView), so both stay in sync regardless
 * of the order rows happen to arrive in (e.g. older data saved before this
 * rule existed).
 *
 * `rows` arrives oldest-added-first (RecentMatchTable only ever appends).
 * `Array.sort` is stable, so a plain sort would keep same-date rows (most
 * often several with no date at all) in that oldest-first order — meaning
 * the match a player just saved could tie with older ones and lose the cap
 * to them. Reversing first flips same-date rows to newest-added-first, so
 * ties break in favor of whatever was saved most recently.
 */
export function sortRecentMatchesNewestFirst<T extends { match_date?: unknown }>(rows: T[]): T[] {
  return [...rows]
    .reverse()
    .sort((a, b) => String(b.match_date ?? '').localeCompare(String(a.match_date ?? '')))
    .slice(0, MAX_RECENT_MATCHES);
}

/**
 * Newest Year first for the Batting/Bowling Career Stats tables (see
 * CricketPlayerDetailView) — a 2027 entry added after a 2026 one should show
 * above it, not below. No cap here (unlike Recent Matches): every
 * Category+Division entry stays visible.
 *
 * Same reverse-then-stable-sort as sortRecentMatchesNewestFirst: rows arrive
 * oldest-added-first (CareerStatTable only ever appends), so reversing first
 * means same-year rows (several Category+Divisions logged in the same year)
 * tie-break in favor of whichever was added most recently.
 */
export function sortCareerStatsNewestFirst<T extends { year?: unknown }>(rows: T[]): T[] {
  return [...rows]
    .reverse()
    .sort((a, b) => String(b.year ?? '').localeCompare(String(a.year ?? '')));
}

export function formatShortMatchDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '--';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

