import { CricketAnalysisResponse, CricketRecentFormEntry } from './cricketAnalysis';
import { CricketProfileResponse } from './cricket';

/** One row from GET /players/search. Cricket-only for now (see PlayerSearchController). */
export interface PlayerSearchResult {
  player_id: number;
  full_name: string | null;
  team: string | null;
  sport: string;
  overview: CricketAnalysisResponse['overview'];
  /** Last 5, most-recent-first. */
  recent_form: CricketRecentFormEntry[];
}

/** Shape returned by GET /players/{player}/cricket-profile. */
export interface PublicPlayerProfile {
  player: {
    id: number;
    full_name: string | null;
    country: string | null;
    photo_url: string | null;
    cover_photo_url: string | null;
  };
  cricket_profile: CricketProfileResponse;
}
