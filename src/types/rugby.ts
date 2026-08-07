export interface RugbyCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  matches: string;
  win: string;
  lost: string;
  tries: string;
  conversion: string;
  penalty_kick: string;
  drop_goal: string;
  yellow_card: string;
  red_card: string;
}

export interface RugbyRecentMatchRowForm {
  match_date: string;
  opponent: string;
  win: boolean;
  lost: boolean;
  tries: string;
  conversion: string;
  penalty_kick: string;
  drop_goal: string;
  yellow_card: string;
  red_card: string;
}

export interface RugbyProfileFormValues {
  born: string;
  age: string;
  height: string;
  weight: string;
  player_position: string;
  college_university: string;
  teams: string[];
  career_stats: RugbyCareerRowForm[];
  recent_matches: RugbyRecentMatchRowForm[];
}

export interface RugbyProfileResponse {
  id: number | null;
  born: string | null;
  age: number | null;
  height: string | null;
  weight: string | null;
  player_position: string | null;
  college_university: string | null;
  teams: string[];
  career_stats: Record<string, unknown>[];
  recent_matches: Record<string, unknown>[];
}
