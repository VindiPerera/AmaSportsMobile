export interface LookupOption {
  id: number;
  name: string;
}

export interface SportOption {
  id: number;
  name: string;
  slug: string;
  has_full_form: boolean;
}

/** Judo weight class, e.g. "60", "+81" — `label` instead of `name` since it's a weight, not a proper noun. */
export interface WeightPositionOption {
  id: number;
  label: string;
}

export type AthleticsEventType = 'running' | 'jumping' | 'throwing' | 'walking';

export interface AthleticsEventOption {
  id: number;
  name: string;
  type: AthleticsEventType;
}

export interface Lookups {
  sports: SportOption[];
  formats: LookupOption[];
  age_categories: LookupOption[];
  match_categories: LookupOption[];
  cricket_match_types: LookupOption[];
  weight_positions: WeightPositionOption[];
  competition_levels: LookupOption[];
  athletics_events: AthleticsEventOption[];
  swimming_events: LookupOption[];
  boxing_weight_classes: LookupOption[];
  karate_styles: LookupOption[];
  // Phase 7 additions — Cricket Fielding/Bowling Analyses.
  field_positions: LookupOption[];
  drop_reasons: LookupOption[];
  pitching_lines: LookupOption[];
  ball_types: LookupOption[];
}
