import { DropdownOption } from '../components/player/Dropdown';

/** Static list — no admin-editable use case for this one, unlike the sport lookup tables. */
const COUNTRY_NAMES = [
  'Sri Lanka', 'India', 'Pakistan', 'Bangladesh', 'Nepal', 'Bhutan', 'Maldives', 'Afghanistan',
  'Australia', 'New Zealand', 'England', 'Scotland', 'Wales', 'Ireland', 'South Africa',
  'Zimbabwe', 'Kenya', 'Namibia', 'United Arab Emirates', 'Oman', 'Qatar', 'Saudi Arabia',
  'United States', 'Canada', 'West Indies', 'Jamaica', 'Trinidad and Tobago', 'Barbados',
  'China', 'Japan', 'South Korea', 'Malaysia', 'Singapore', 'Thailand', 'Indonesia',
  'Philippines', 'Vietnam', 'Hong Kong', 'Germany', 'France', 'Italy', 'Spain', 'Portugal',
  'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Poland', 'Russia', 'Turkey', 'Greece', 'Egypt', 'Nigeria', 'Ghana', 'Brazil', 'Argentina',
  'Other',
].sort((a, b) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)));

export const COUNTRY_OPTIONS: DropdownOption[] = COUNTRY_NAMES.map((name) => ({
  label: name,
  value: name,
}));
