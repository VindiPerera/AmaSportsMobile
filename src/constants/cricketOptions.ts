import { DropdownOption } from '../components/player/Dropdown';

/** Static — spec 6.2 asks for "the standard cricket bowling style list", not an admin-editable table. */
export const BATTING_STYLE_OPTIONS: DropdownOption[] = [
  { label: 'Right-hand bat', value: 'Right-hand bat' },
  { label: 'Left-hand bat', value: 'Left-hand bat' },
];

export const BOWLING_STYLE_OPTIONS: DropdownOption[] = [
  { label: 'Right-arm fast', value: 'Right-arm fast' },
  { label: 'Right-arm fast-medium', value: 'Right-arm fast-medium' },
  { label: 'Right-arm medium', value: 'Right-arm medium' },
  { label: 'Right-arm off-break', value: 'Right-arm off-break' },
  { label: 'Right-arm leg-break', value: 'Right-arm leg-break' },
  { label: 'Right-arm googly', value: 'Right-arm googly' },
  { label: 'Left-arm fast', value: 'Left-arm fast' },
  { label: 'Left-arm fast-medium', value: 'Left-arm fast-medium' },
  { label: 'Left-arm medium', value: 'Left-arm medium' },
  { label: 'Left-arm orthodox', value: 'Left-arm orthodox' },
  { label: 'Left-arm chinaman', value: 'Left-arm chinaman' },
  { label: 'None', value: 'None' },
];

export const PLAYING_ROLE_OPTIONS: DropdownOption[] = [
  { label: 'Batsman', value: 'Batsman' },
  { label: 'Bowler', value: 'Bowler' },
  { label: 'All-rounder', value: 'All-rounder' },
  { label: 'Wicket-keeper', value: 'Wicket-keeper' },
];
