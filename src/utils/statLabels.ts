/** Format/Category names long enough to break a stat table's compact
 * columns (see the shared `formats`/`match_categories`/`cricket_categories`
 * lookups) — shortened for read-only display only. The edit/registration
 * forms keep full names in their dropdowns; this never touches those. */
const ABBREVIATIONS: Record<string, string> = {
  Academy: 'Aca',
  Practice: 'Pra',
  Tournament: 'Tour',
  Friendly: 'Fri',
  Mercantile: 'Mer',
  'State Service': 'S.Ser',
  School: 'Sch',
  International: 'Intl',
  National: 'Nat',
  District: 'Dist',
  Province: 'Prov',
  Premier: 'Prem',
  'Super League': 'S.Lg',
  Zonal: 'Zon',
};

export function abbreviateStatLabel(value: string): string {
  return ABBREVIATIONS[value] ?? value;
}
