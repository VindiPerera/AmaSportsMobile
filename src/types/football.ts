export type DominantLeg = 'right' | 'left';

export interface FootballCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  play_position: string;
  matches: string;
  win: string;
  lost: string;
  goals: string;
  assists: string;
  defensive_actions: string;
  goalkeeper_clean_sheets: string;
  goalkeeper_goals_conceded: string;
  yellow_card: string;
  red_card: string;
}

export interface FootballRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  play_position: string;
  win: boolean;
  lost: boolean;
  goals: string;
  assists: string;
  defensive_actions: string;
  goalkeeper_clean_sheets: string;
  goalkeeper_goals_conceded: string;
  yellow_card: string;
  red_card: string;
}

export interface FootballProfileFormValues {
  born: string;
  age: string;
  height: string;
  dominant_leg: DominantLeg | '';
  player_position: string;
  college_university: string;
  teams: string[];
  career_stats: FootballCareerRowForm[];
  recent_matches: FootballRecentMatchRowForm[];
}

export interface FootballProfileResponse {
  id: number | null;
  born: string | null;
  age: number | null;
  height: string | null;
  dominant_leg: DominantLeg | null;
  player_position: string | null;
  college_university: string | null;
  teams: string[];
  career_stats: Record<string, unknown>[];
  recent_matches: Record<string, unknown>[];
}
