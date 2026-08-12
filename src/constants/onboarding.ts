import { Ionicons } from '@expo/vector-icons';
import { ColorToken } from '../theme';

export interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
  imageUrl: string;
  accent: Extract<ColorToken, 'primary' | 'energy' | 'live'>;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'badminton_performance',
    icon: 'tennisball-outline',
    title: 'TRACK STATS.\nCRUSH GOALS.',
    subtitle: 'Badminton & Racket Sports',
    description: 'Log match rallies, track smash velocities, and turn game stats into winning insights.',
    badgeText: 'BADMINTON PERFORMANCE',
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1000&q=80',
    accent: 'primary',
  },
  {
    id: 'live',
    icon: 'radio-outline',
    title: 'LIVE SCORES.\nREAL-TIME STREAMS.',
    subtitle: 'Point-by-Point Sync',
    description: 'Watch video streams, track real-time scoreboards, and never miss a match moment.',
    badgeText: 'LIVE MATCH HUB',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
    accent: 'live',
  },
  {
    id: 'profile',
    icon: 'trophy-outline',
    title: 'BUILD YOUR\nATHLETIC LEGACY.',
    subtitle: 'Verified Profile Cards',
    description: 'Showcase career milestones, share sports profile cards, and get scouted by top coaches.',
    badgeText: 'CAREER RECORDS',
    imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80',
    accent: 'energy',
  },
];
