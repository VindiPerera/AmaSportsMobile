import { DropdownOption } from '../components/player/Dropdown';

/** Football's "Dominant Leg" (spec Phase 3 §C6) — same right/left shape as Dominant Hand elsewhere. */
export const DOMINANT_LEG_OPTIONS: DropdownOption[] = [
  { label: 'Right', value: 'right' },
  { label: 'Left', value: 'left' },
];

/** Basketball's "Dominant Hand" — same right/left shape as Dominant Leg above. */
export const DOMINANT_HAND_OPTIONS: DropdownOption[] = [
  { label: 'Right', value: 'right' },
  { label: 'Left', value: 'left' },
];
