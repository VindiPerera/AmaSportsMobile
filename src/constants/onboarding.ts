import { Ionicons } from '@expo/vector-icons';
import { ColorToken } from '../theme';

export interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  /** Which color token drives this slide's icon circle + gradient accent. */
  accent: Extract<ColorToken, 'primary' | 'energy' | 'live'>;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'performance',
    icon: 'stats-chart',
    title: 'Track Every Performance',
    description:
      'Log training sessions, monitor progress, and turn raw numbers into insights for every athlete on your team.',
    accent: 'primary',
  },
  {
    id: 'teams',
    icon: 'people',
    title: 'Coaches & Students, Connected',
    description:
      'Coaches manage teams and drills. Students follow their plans and see feedback — all in one shared workspace.',
    accent: 'energy',
  },
  {
    id: 'live',
    icon: 'radio',
    title: 'Live Scores & Updates',
    description:
      'Get real-time match updates, live streaming, and instant notifications so you never miss a moment.',
    accent: 'live',
  },
];
