import { ImageSourcePropType } from 'react-native';

export interface OnboardingSlide {
  id: string;
  /** Plain part of the headline. */
  headline: string;
  /** Highlighted part of the headline — rendered on the lime accent pill. */
  headlineAccent: string;
  description: string;
  /** Remote URL string, or a local `require(...)` asset. */
  image: ImageSourcePropType;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'cricket_performance',
    headline: 'Every Ball,',
    headlineAccent: 'Every Run',
    description: 'Live cricket scores, plus basketball, football and more, updated the instant they happen.',
    image: require('../../assets/onboarding-cricket.png'),
  },
  {
    id: 'live',
    headline: 'Numbers Behind',
    headlineAccent: 'The Game',
    description: 'Batting, bowling and form breakdowns for every player you follow, across every sport.',
    image: require('../../assets/onboarding-stats.png'),
  },
  {
    id: 'profile',
    headline: 'Your Favorite',
    headlineAccent: 'Players, Tracked',
    description: 'Build a profile for every sport you play or follow, and see how you stack up.',
    image: require('../../assets/onboarding-profile.png'),
  },
];
