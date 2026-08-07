import { DominantHand } from './player';

export interface BasketballCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  matches: string;
  win: string;
  lost: string;
  points: string;
  rebounds: string;
  assists: string;
  blocks: string;
  steals: string;
  minutes: string;
}

export interface BasketballRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  win: boolean;
  lost: boolean;
  points: string;
  rebounds: string;
  assists: string;
  blocks: string;
  steals: string;
  minutes: string;
}

export interface BasketballProfileFormValues {
  born: string;
  age: string;
  height: string;
  dominant_hand: DominantHand | '';
  player_position: string;
  college_university: string;
  teams: string[];
  career_stats: BasketballCareerRowForm[];
  recent_matches: BasketballRecentMatchRowForm[];
}

export interface BasketballProfileResponse {
  id: number | null;
  born: string | null;
  age: number | null;
  height: string | null;
  dominant_hand: DominantHand | null;
  player_position: string | null;
  college_university: string | null;
  teams: string[];
  career_stats: Record<string, unknown>[];
  recent_matches: Record<string, unknown>[];
}
