export type MatchStatus = 'upcoming' | 'live' | 'finished';

/** A roster entry an admin added for this match/side — no app account attached. */
export interface MatchTeamPlayer {
  id: string;
  name: string;
  photo_url?: string;
}

export interface MatchTeam {
  id: number;
  name: string;
  logo_url?: string;
  photo_url?: string;
  school_academy?: string;
  club?: string;
  country?: string;
  /** Only present on the Match Detail response (`/matches/{id}`), not the list. */
  players?: MatchTeamPlayer[];
}

export interface MatchSport {
  id: number;
  name: string;
  slug: string;
}

/** `live_score` payload supports Cricket, Badminton, Volleyball, Tennis, Basketball, Elle, Judo. */
export interface CricketLiveScore {
  batting_team?: string;
  bowling_team?: string;
  innings?: number;
  runs?: number;
  wickets?: number;
  overs?: number;
  summary?: string;
}

export interface RacketLiveScore {
  set1_home?: number;
  set1_away?: number;
  set2_home?: number;
  set2_away?: number;
  set3_home?: number;
  set3_away?: number;
  current_set?: number;
  points_home?: number;
  points_away?: number;
}

export interface JudoLiveScore {
  home_ippon?: number;
  home_waza_ari?: number;
  home_yuko?: number;
  home_shido?: number;
  home_g_score?: number;
  away_ippon?: number;
  away_waza_ari?: number;
  away_yuko?: number;
  away_shido?: number;
  away_g_score?: number;
}

export interface MatchSummary {
  id: number;
  sport: MatchSport;
  home_team: MatchTeam;
  away_team: MatchTeam;
  status: MatchStatus;
  scheduled_at: string | null;
  venue: string | null;
  format?: string;
  age_group?: string;
  category?: string;
  country?: string;
  date?: string;
  live_score: CricketLiveScore | RacketLiveScore | JudoLiveScore | Record<string, unknown> | null;
  youtube_stream_url: string | null;
}
