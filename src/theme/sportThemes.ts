import { Ionicons } from '@expo/vector-icons';
import { colors } from './colors';

export interface SportTheme {
  name: string;
  slug: string;
  /** Primary brand color for this sport */
  primary: string;
  /** Deep tone for header banner, tab rail backdrop */
  primaryDark: string;
  /** Radiant accent color for active tab text, icons, and glowing indicators */
  accent: string;
  /** Translucent accent for active tab capsule background */
  accentMuted: string;
  /** 2-stop gradient array [top, bottom] for hero banner */
  gradient: readonly [string, string];
  /** Dedicated background tone for the tab bar navigation rail */
  tabBg: string;
  /** Active tab capsule fill */
  tabActiveBg: string;
  /** Border stroke for active tab */
  tabActiveBorder: string;
  /** Ionicons glyph symbol for this sport */
  icon: keyof typeof Ionicons.glyphMap;
  /** Short tagline / discipline descriptor */
  tagline: string;
}

export const SPORT_THEMES: Record<string, SportTheme> = {
  cricket: {
    name: 'Cricket',
    slug: 'cricket',
    primary: '#1E3A8A', // Sri Lankan Lion Navy Blue
    primaryDark: '#0B1B3D',
    accent: '#D7FF3F', // Electric Lime-Gold Energy
    accentMuted: 'rgba(215, 255, 63, 0.15)',
    gradient: ['#0B1B3D', '#172554'] as const,
    tabBg: '#09152E',
    tabActiveBg: 'rgba(215, 255, 63, 0.14)',
    tabActiveBorder: 'rgba(215, 255, 63, 0.45)',
    icon: 'baseball-outline',
    tagline: 'The Gentleman’s Game',
  },
  'soft-ball-cricket': {
    name: 'Soft Ball Cricket',
    slug: 'soft-ball-cricket',
    primary: '#0284C7', // Tropical Azure
    primaryDark: '#082F49',
    accent: '#FB923C', // Island Neon Orange
    accentMuted: 'rgba(251, 146, 60, 0.16)',
    gradient: ['#082F49', '#0369A1'] as const,
    tabBg: '#052236',
    tabActiveBg: 'rgba(251, 146, 60, 0.16)',
    tabActiveBorder: 'rgba(251, 146, 60, 0.45)',
    icon: 'baseball-outline',
    tagline: 'Island Street & Turf Cricket',
  },
  football: {
    name: 'Football',
    slug: 'football',
    primary: '#059669', // Pitch Emerald
    primaryDark: '#063D2F',
    accent: '#10B981', // Bright Turf Mint
    accentMuted: 'rgba(16, 185, 129, 0.18)',
    gradient: ['#063D2F', '#047857'] as const,
    tabBg: '#04281F',
    tabActiveBg: 'rgba(16, 185, 129, 0.20)',
    tabActiveBorder: 'rgba(16, 185, 129, 0.50)',
    icon: 'football-outline',
    tagline: 'The Beautiful Game',
  },
  rugby: {
    name: 'Rugby',
    slug: 'rugby',
    primary: '#991B1B', // Sri Lankan Rugby Maroon
    primaryDark: '#450A0A',
    accent: '#FBBF24', // Golden Horns Amber
    accentMuted: 'rgba(251, 191, 36, 0.18)',
    gradient: ['#450A0A', '#7F1D1D'] as const,
    tabBg: '#2A0606',
    tabActiveBg: 'rgba(251, 191, 36, 0.20)',
    tabActiveBorder: 'rgba(251, 191, 36, 0.50)',
    icon: 'american-football-outline',
    tagline: 'Pride, Passion & Power',
  },
  basketball: {
    name: 'Basketball',
    slug: 'basketball',
    primary: '#EA580C', // Court Amber
    primaryDark: '#2A1208',
    accent: '#F97316', // Electric Slam Orange
    accentMuted: 'rgba(249, 115, 22, 0.18)',
    gradient: ['#2A1208', '#9A3412'] as const,
    tabBg: '#1A0B05',
    tabActiveBg: 'rgba(249, 115, 22, 0.20)',
    tabActiveBorder: 'rgba(249, 115, 22, 0.50)',
    icon: 'basketball-outline',
    tagline: 'Hardwood & Hoops',
  },
  athletics: {
    name: 'Athletics',
    slug: 'athletics',
    primary: '#DC2626', // Sprint Crimson
    primaryDark: '#1C1917',
    accent: '#F59E0B', // Olympic Gold
    accentMuted: 'rgba(245, 158, 11, 0.20)',
    gradient: ['#1C1917', '#7F1D1D'] as const,
    tabBg: '#131110',
    tabActiveBg: 'rgba(245, 158, 11, 0.22)',
    tabActiveBorder: 'rgba(245, 158, 11, 0.50)',
    icon: 'walk-outline',
    tagline: 'Faster, Higher, Stronger',
  },
  swimming: {
    name: 'Swimming',
    slug: 'swimming',
    primary: '#0284C7', // Aquatic Blue
    primaryDark: '#082F49',
    accent: '#38BDF8', // Cyan Splash
    accentMuted: 'rgba(56, 189, 248, 0.18)',
    gradient: ['#082F49', '#0369A1'] as const,
    tabBg: '#051E30',
    tabActiveBg: 'rgba(56, 189, 248, 0.20)',
    tabActiveBorder: 'rgba(56, 189, 248, 0.50)',
    icon: 'water-outline',
    tagline: 'Speed Through The Waves',
  },
  judo: {
    name: 'Judo',
    slug: 'judo',
    primary: '#4338CA', // Dojo Indigo
    primaryDark: '#1E1B4B',
    accent: '#818CF8', // Tatami Lavender
    accentMuted: 'rgba(129, 140, 248, 0.18)',
    gradient: ['#1E1B4B', '#3730A3'] as const,
    tabBg: '#131133',
    tabActiveBg: 'rgba(129, 140, 248, 0.20)',
    tabActiveBorder: 'rgba(129, 140, 248, 0.50)',
    icon: 'body-outline',
    tagline: 'The Gentle Way of Discipline',
  },
  karate: {
    name: 'Karate',
    slug: 'karate',
    primary: '#BE123C', // Bushido Rose
    primaryDark: '#18181B',
    accent: '#FB7185', // Crimson Strike
    accentMuted: 'rgba(251, 113, 133, 0.18)',
    gradient: ['#18181B', '#881337'] as const,
    tabBg: '#121013',
    tabActiveBg: 'rgba(251, 113, 133, 0.20)',
    tabActiveBorder: 'rgba(251, 113, 133, 0.50)',
    icon: 'body-outline',
    tagline: 'Way of the Empty Hand',
  },
  boxing: {
    name: 'Boxing',
    slug: 'boxing',
    primary: '#B91C1C', // Ring Crimson
    primaryDark: '#1C1917',
    accent: '#EF4444', // Knockout Scarlet
    accentMuted: 'rgba(239, 68, 68, 0.18)',
    gradient: ['#1C1917', '#7F1D1D'] as const,
    tabBg: '#121110',
    tabActiveBg: 'rgba(239, 68, 68, 0.20)',
    tabActiveBorder: 'rgba(239, 68, 68, 0.50)',
    icon: 'fitness-outline',
    tagline: 'The Sweet Science',
  },
  volleyball: {
    name: 'Volleyball',
    slug: 'volleyball',
    primary: '#0284C7', // Sky Spike Blue
    primaryDark: '#0C2D48',
    accent: '#FBBF24', // Sunburst Amber
    accentMuted: 'rgba(251, 191, 36, 0.18)',
    gradient: ['#0C2D48', '#0369A1'] as const,
    tabBg: '#071F33',
    tabActiveBg: 'rgba(251, 191, 36, 0.20)',
    tabActiveBorder: 'rgba(251, 191, 36, 0.50)',
    icon: 'basketball-outline',
    tagline: 'Elevate & Strike',
  },
  'beach-volleyball': {
    name: 'Beach Volleyball',
    slug: 'beach-volleyball',
    primary: '#0284C7', // Tropic Azure
    primaryDark: '#0F324D',
    accent: '#F59E0B', // Golden Sand
    accentMuted: 'rgba(245, 158, 11, 0.18)',
    gradient: ['#0F324D', '#0891B2'] as const,
    tabBg: '#092133',
    tabActiveBg: 'rgba(245, 158, 11, 0.20)',
    tabActiveBorder: 'rgba(245, 158, 11, 0.50)',
    icon: 'sunny-outline',
    tagline: 'Sun, Sand & Power Spikes',
  },
  elle: {
    name: 'Elle',
    slug: 'elle',
    primary: '#831843', // Kandyan Royal Maroon
    primaryDark: '#3B0724',
    accent: '#FBBF24', // Heritage Saffron Gold
    accentMuted: 'rgba(251, 191, 36, 0.20)',
    gradient: ['#3B0724', '#701A75'] as const,
    tabBg: '#240416',
    tabActiveBg: 'rgba(251, 191, 36, 0.22)',
    tabActiveBorder: 'rgba(251, 191, 36, 0.50)',
    icon: 'baseball-outline',
    tagline: 'Sri Lanka’s Heritage National Game',
  },
  kabadi: {
    name: 'Kabaddi',
    slug: 'kabadi',
    primary: '#C2410C', // Raid Terracotta
    primaryDark: '#2E0F05',
    accent: '#F97316', // Warrior Ochre
    accentMuted: 'rgba(249, 115, 22, 0.20)',
    gradient: ['#2E0F05', '#9A3412'] as const,
    tabBg: '#1C0903',
    tabActiveBg: 'rgba(249, 115, 22, 0.22)',
    tabActiveBorder: 'rgba(249, 115, 22, 0.50)',
    icon: 'people-outline',
    tagline: 'Breathe, Touch & Conquer',
  },
  hockey: {
    name: 'Hockey',
    slug: 'hockey',
    primary: '#15803D', // Turf Forest
    primaryDark: '#052E16',
    accent: '#84CC16', // Electric Turf Lime
    accentMuted: 'rgba(132, 204, 22, 0.18)',
    gradient: ['#052E16', '#166534'] as const,
    tabBg: '#031E0E',
    tabActiveBg: 'rgba(132, 204, 22, 0.20)',
    tabActiveBorder: 'rgba(132, 204, 22, 0.50)',
    icon: 'golf-outline',
    tagline: 'Field Precision & Speed',
  },
  'base-ball': {
    name: 'Baseball',
    slug: 'base-ball',
    primary: '#1D4ED8', // Diamond Blue
    primaryDark: '#0F172A',
    accent: '#EF4444', // Home-run Scarlet
    accentMuted: 'rgba(239, 68, 68, 0.18)',
    gradient: ['#0F172A', '#1E40AF'] as const,
    tabBg: '#091020',
    tabActiveBg: 'rgba(239, 68, 68, 0.20)',
    tabActiveBorder: 'rgba(239, 68, 68, 0.50)',
    icon: 'baseball-outline',
    tagline: 'Diamond Glory',
  },
  netball: {
    name: 'Netball',
    slug: 'netball',
    primary: '#7C3AED', // Court Purple
    primaryDark: '#2E1065',
    accent: '#F472B6', // Dynamic Orchid Rose
    accentMuted: 'rgba(244, 114, 182, 0.18)',
    gradient: ['#2E1065', '#5B21B6'] as const,
    tabBg: '#1C0A3E',
    tabActiveBg: 'rgba(244, 114, 182, 0.20)',
    tabActiveBorder: 'rgba(244, 114, 182, 0.50)',
    icon: 'basketball-outline',
    tagline: 'Speed, Agility & Teamwork',
  },
  chess: {
    name: 'Chess',
    slug: 'chess',
    primary: '#475569', // Obsidian Grandmaster
    primaryDark: '#0F172A',
    accent: '#F59E0B', // Crown Gold
    accentMuted: 'rgba(245, 158, 11, 0.18)',
    gradient: ['#0F172A', '#334155'] as const,
    tabBg: '#090E1A',
    tabActiveBg: 'rgba(245, 158, 11, 0.20)',
    tabActiveBorder: 'rgba(245, 158, 11, 0.50)',
    icon: 'grid-outline',
    tagline: 'Grandmaster Tactics & Strategy',
  },
  badminton: {
    name: 'Badminton',
    slug: 'badminton',
    primary: '#0D9488', // Smash Teal
    primaryDark: '#042F2E',
    accent: '#2DD4BF', // Neon Shuttle Aqua
    accentMuted: 'rgba(45, 212, 191, 0.18)',
    gradient: ['#042F2E', '#0F766E'] as const,
    tabBg: '#021F1E',
    tabActiveBg: 'rgba(45, 212, 191, 0.20)',
    tabActiveBorder: 'rgba(45, 212, 191, 0.50)',
    icon: 'tennisball-outline',
    tagline: 'Lightning Reflexes & Smashes',
  },
  tennis: {
    name: 'Tennis',
    slug: 'tennis',
    primary: '#15803D', // Court Green
    primaryDark: '#052E16',
    accent: '#CCFF00', // Electric Tennis Volt
    accentMuted: 'rgba(204, 255, 0, 0.18)',
    gradient: ['#052E16', '#166534'] as const,
    tabBg: '#031E0E',
    tabActiveBg: 'rgba(204, 255, 0, 0.20)',
    tabActiveBorder: 'rgba(204, 255, 0, 0.50)',
    icon: 'tennisball-outline',
    tagline: 'Grand Slam Court Mastery',
  },
  'table-tennis': {
    name: 'Table Tennis',
    slug: 'table-tennis',
    primary: '#2563EB', // Spin Sapphire
    primaryDark: '#0F172A',
    accent: '#F43F5E', // Rubber Coral Rose
    accentMuted: 'rgba(244, 63, 94, 0.18)',
    gradient: ['#0F172A', '#1D4ED8'] as const,
    tabBg: '#0A0F1D',
    tabActiveBg: 'rgba(244, 63, 94, 0.20)',
    tabActiveBorder: 'rgba(244, 63, 94, 0.50)',
    icon: 'tennisball-outline',
    tagline: 'Precision Spin & Fast Rallies',
  },
};

/** Fallback theme for unrecognized or new sports */
export const DEFAULT_SPORT_THEME: SportTheme = {
  name: 'Sport',
  slug: 'sport',
  primary: colors.primary,
  primaryDark: colors.navyDark,
  accent: colors.energy,
  accentMuted: 'rgba(215, 255, 63, 0.15)',
  gradient: colors.gradientHero,
  tabBg: colors.primaryDark,
  tabActiveBg: 'rgba(215, 255, 63, 0.15)',
  tabActiveBorder: 'rgba(215, 255, 63, 0.45)',
  icon: 'trophy-outline',
  tagline: 'Athlete Performance',
};

/**
 * Normalizes any sport name or slug (e.g. "Judo", "judo", "Soft Ball Cricket",
 * "soft-ball-cricket", "net-ball", "Netball", etc.) into a matching SportTheme.
 */
export function getSportTheme(sportNameOrSlug?: string | null): SportTheme {
  if (!sportNameOrSlug) return DEFAULT_SPORT_THEME;

  const normalized = sportNameOrSlug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');

  // Direct slug match
  if (SPORT_THEMES[normalized]) {
    return SPORT_THEMES[normalized];
  }

  // Common aliases
  if (normalized === 'baseball' || normalized === 'base-ball') {
    return SPORT_THEMES['base-ball'];
  }
  if (normalized === 'netball' || normalized === 'net-ball') {
    return SPORT_THEMES['netball'];
  }
  if (normalized === 'kabaddi' || normalized === 'kabadi') {
    return SPORT_THEMES['kabadi'];
  }
  if (normalized === 'racket-sport' || normalized === 'racketsport') {
    return SPORT_THEMES['badminton'];
  }

  // Partial or name match search
  const found = Object.values(SPORT_THEMES).find(
    (t) =>
      t.name.toLowerCase() === sportNameOrSlug.trim().toLowerCase() ||
      t.slug === normalized ||
      normalized.includes(t.slug)
  );

  return found ?? {
    ...DEFAULT_SPORT_THEME,
    name: sportNameOrSlug.trim(),
    slug: normalized,
  };
}
