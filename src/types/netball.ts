import { DominantHand } from './player';

export interface NetBallCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  matches: string;
  matches_won: string;
  matches_lost: string;
  goals: string;
  attempts: string;
  goal_accuracy: string;
  result_won: string;
  result_lost: string;
}

export interface NetBallRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  goals: string;
  attempts: string;
  goal_accuracy: string;
  win: boolean;
  lost: boolean;
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
