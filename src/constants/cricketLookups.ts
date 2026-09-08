/** Cricket's "Format" and "Category" lists — client-provided (see
 * CricketCategorySeeder/CricketDivisionSeeder on the backend for the same
 * lists). Exact order matters; this is the sheet's own left-to-right,
 * top-to-bottom order.
 *
 * The backend lookup tables may still carry older values (pre-dating this
 * list) that a foreign key from existing stat rows prevents deleting
 * outright — filtering + reordering against this canonical list here keeps
 * the dropdowns showing exactly this set, in this order, regardless of
 * whatever else is sitting in the database. */
export const CRICKET_FORMATS = [
  'Under 13 Div I', 'Under 13 Div II', 'Under 13 Div III', 'Under 13 Zonal',
  'Under 15 Div I', 'Under 15 Div II', 'Under 15 Div III', 'Under 15 Zonal',
  'Under 17 Div I', 'Under 17 Div II', 'Under 17 Div III', 'Under 17 Zonal',
  'Under 19 Div I', 'Under 19 Div II', 'Under 19 Div III', 'Under 19 Zonal',
  'Under 15 District', 'Under 15 Provincial', 'Under 15 National',
  'Under 17 District', 'Under 17 Provincial', 'Under 17 National',
  'Under 19 District', 'Under 19 Provincial', 'Under 19 National',
  'Premier', 'Tier B',
  'Division I', 'Division II', 'Division III', 'Division IV',
  'Practice', 'Friendly',
  'State Service Div I', 'State Service Div II', 'State Service Div III',
  'Mercantile Div I', 'Mercantile Div II', 'Mercantile Div III',
  'Academy',
  'Under 20', 'Under 21', 'Under 22', 'Under 23',
  'National', 'Zonal', 'Super League', 'List A', 'Other',
] as const;

export const CRICKET_CATEGORIES = [
  'Six a side', 'T10', 'T20', '30 Over', '40 Over', '50 Over',
  'One Day', 'Two Day', 'Three Day', 'Four Day', 'Test',
] as const;
