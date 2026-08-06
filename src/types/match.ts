export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface MatchTeam {
  id: number;
  name: string;
}

export interface MatchSport {
  id: number;
  name: string;
  slug: string;
}

/** `live_score` is a free-form JSON blob — shape starts with Cricket (see spec §5). */
export interface CricketLiveScore {
  batting_team?: string;
  bowling_team?: string;
  innings?: number;
  runs?: number;
  wickets?: number;
  overs?: number;
  summary?: string;
}

export interface MatchSummary {
  id: number;
  sport: MatchSport;
  home_team: MatchTeam;
  away_team: MatchTeam;
  status: MatchStatus;
  scheduled_at: string | null;
  venue: string | null;
  live_score: CricketLiveScore | Record<string, unknown> | null;
  youtube_stream_url: string | null;
}
