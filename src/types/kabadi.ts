/** Field names spelled out; the abbreviated labels (R, SR, CBP, ...) live in the UI/glossary only. */
export interface KabadiStatFields {
  tpe: string;
  cbp: string;
  raids: string;
  successful_raids: string;
  unsuccessful_raids: string;
  empty_raids: string;
  raid_touch_point: string;
  raid_bonus_point: string;
  tackles: string;
  successful_tackles: string;
  unsuccessful_tackles: string;
  green_cards: string;
  yellow_cards: string;
  red_cards: string;
}

export interface KabadiCareerRowForm extends KabadiStatFields {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  matches: string;
  win: string;
  lost: string;
}

export interface KabadiRecentMatchRowForm extends KabadiStatFields {
  match_date: string;
  opponent: string;
  venue: string;
  win: boolean;
  lost: boolean;
}

export interface KabadiProfileFormValues {
  born: string;
  age: string;
  height: string;
  weight: string;
  player_position: string;
  college_university: string;
  teams: string[];
  career_stats: KabadiCareerRowForm[];
  recent_matches: KabadiRecentMatchRowForm[];
}

export interface KabadiProfileResponse {
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
