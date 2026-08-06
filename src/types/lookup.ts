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

export interface Lookups {
  sports: SportOption[];
  formats: LookupOption[];
  age_categories: LookupOption[];
  match_categories: LookupOption[];
  cricket_match_types: LookupOption[];
}
