import { DominantHand } from './player';

export interface NetBallCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  play_position: string;
  matches: string;
  goals: string;
  attempts: string;
  goal_accuracy: string;
  won: string;
  lost: string;
  no_result: string;
  draw: string;
  year: string;
}

export interface NetBallRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  goals: string;
  attempts: string;
  goal_accuracy: string;
  play_position: string;
  won: boolean;
  lost: boolean;
  no_result: boolean;
  draw: boolean;
}

export interface NetBallProfileFormValues {
  born: string;
  age: string;
  height: string;
  dominant_hand: DominantHand | '';
  player_position: string;
  college_university: string;
  teams: string[];
  career_stats: NetBallCareerRowForm[];
  recent_matches: NetBallRecentMatchRowForm[];
}

export interface NetBallProfileResponse {
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
