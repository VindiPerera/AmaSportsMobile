import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Firebase configuration using Expo public environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyMockKeyForAmaSportsLive123456',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'amasports-live.firebaseapp.com',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://amasports-live-default-rtdb.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'amasports-live',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'amasports-live.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:mockappid123456',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton initialize Firebase
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const isFirebaseConfigured = !!(
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY
);

let firestoreDb: any = null;
let realtimeDb: any = null;

try {
  firestoreDb = getFirestore(firebaseApp);
} catch {
  // Ignore fallback initialization errors
}

try {
  realtimeDb = getDatabase(firebaseApp);
} catch {
  // Ignore fallback initialization errors
}

/** One batter row on the admin cricket scorer's batting scorecard. */
export interface CricketBatter {
  id: number;
  name: string;
  status: 'yet' | 'bat' | 'out';
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  order: number;
}

/** One bowler row on the admin cricket scorer's bowling figures. */
export interface CricketBowler {
  id: number;
  name: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
}

/**
 * One side's full batting-innings state, as pushed by the admin cricket
 * scorer. `currentBowlerId` indexes into the OPPOSING team's `bowlers`
 * (the side bowling while this side bats).
 */
export interface CricketTeamInnings {
  name: string;
  batters: CricketBatter[];
  bowlers: CricketBowler[];
  strikerId: number | null;
  nonStrikerId: number | null;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  currentOver: string[];
  currentBowlerId: number | null;
  log: string[];
  allOut: boolean;
  started: boolean;
}

/**
 * Interface for Live Score payload across all supported sports.
 */
export interface MultiSportLiveScore {
  match_id: number;
  sport_slug: string;
  status: 'live' | 'upcoming' | 'finished';
  last_updated?: string;
  
  // General Metadata (from UI specification sheets)
  format?: string;       // e.g. "Single", "Double", "Mix Double", "T20", "50 Overs"
  age_group?: string;    // e.g. "Under 17", "Under 19", "Open"
  category?: string;     // e.g. "District", "National", "Inter-School"
  date?: string;
  venue?: string;
  country?: string;      // e.g. "Sri Lanka", "India"

  // Player / Team Profiles
  home_team?: {
    name: string;
    logo_url?: string;
    photo_url?: string;
    school_academy?: string;
    club?: string;
    players?: Array<{ id?: string; name: string; photo_url?: string }>;
  };
  away_team?: {
    name: string;
    logo_url?: string;
    photo_url?: string;
    school_academy?: string;
    club?: string;
    players?: Array<{ id?: string; name: string; photo_url?: string }>;
  };

  // Sport-specific Score Data
  // 1. Badminton / Tennis / Table Tennis / Beach Volleyball
  racket_scores?: {
    set1_home?: number;
    set1_away?: number;
    set2_home?: number;
    set2_away?: number;
    set3_home?: number;
    set3_away?: number;
    current_set?: number;
    points_home?: number;
    points_away?: number;
  };

  // 2. Cricket — the admin's full two-innings ball-by-ball scorer
  // (Admin\LiveScoreController's cricket partial: toss, per-team batting
  // lineup + bowling figures, innings transition, result). `team_a`/`team_b`
  // are fixed slots ("bats in innings 1" / "bats in innings 2"), NOT the
  // literal home/away teams — the toss decides which real team occupies
  // which slot. `batting_team`/`bowling_team`/`runs`/`wickets`/`overs` are
  // the OLD flat shape from before the full scorer existed — kept optional
  // so any match scored before this shipped still decodes without crashing.
  cricket_score?: {
    team_a_name?: string;
    team_b_name?: string;
    toss_winner?: 'home' | 'away';
    toss_choice?: 'bat' | 'bowl';
    /** 1 or 2 for the full scorer; may be a plain number on legacy documents. */
    innings?: number;
    team_a?: CricketTeamInnings;
    team_b?: CricketTeamInnings;
    result?: { winner: 'A' | 'B' | 'tie'; margin: string } | null;
    summary?: string;

    // Legacy flat shape (pre full-scorer) — optional fallback only.
    batting_team?: string;
    bowling_team?: string;
    runs?: number;
    wickets?: number;
    overs?: number;
  };

  // 3. Judo
  judo_score?: {
    home_ippon?: number;
    home_waza_ari?: number;
    home_yuko?: number;
    home_shido?: number;
    home_g_score?: number;
    away_ippon?: number;
    away_waza_ari?: number;
    away_yuko?: number;
    away_shido?: number;
    away_g_score?: number;
  };

  // 4. Basketball / Volleyball / Elle
  team_score?: {
    home_total?: number;
    away_total?: number;
    home_sets_or_breakdown?: number[];
    away_sets_or_breakdown?: number[];
    outs_home?: number;
    outs_away?: number;
  };
}

// In-memory real-time state store for seamless fallback subscription
const localLiveScoreStore: Record<number, MultiSportLiveScore> = {};

/** Local, interval-based fake live-tick — used when Firebase isn't configured or a real subscription fails. */
function startLocalSimulation(matchId: number, onUpdate: (score: MultiSportLiveScore) => void): () => void {
  // Trigger initial emission
  if (localLiveScoreStore[matchId]) {
    onUpdate(localLiveScoreStore[matchId]);
  }

  // Simulate periodic live updates (every 4 seconds) to demonstrate real-time Firebase sync in UI
  const intervalId = setInterval(() => {
    if (localLiveScoreStore[matchId]) {
      const current = localLiveScoreStore[matchId];
      if (current.status === 'live') {
        const updated = { ...current, last_updated: new Date().toLocaleTimeString() };

        // Increment Badminton / Tennis / Volleyball points
        if (updated.racket_scores) {
          const homeWins = Math.random() > 0.45;
          if (homeWins) {
            updated.racket_scores.points_home = (updated.racket_scores.points_home ?? 15) + 1;
          } else {
            updated.racket_scores.points_away = (updated.racket_scores.points_away ?? 10) + 1;
          }
        }

        // Increment Cricket runs
        if (updated.cricket_score) {
          const runsAdd = Math.floor(Math.random() * 4);
          updated.cricket_score.runs = (updated.cricket_score.runs ?? 309) + runsAdd;
          updated.cricket_score.summary = `Last ball: +${runsAdd} runs (${new Date().toLocaleTimeString()})`;
        }

        // Increment Team Scores
        if (updated.team_score) {
          updated.team_score.home_total = (updated.team_score.home_total ?? 68) + Math.floor(Math.random() * 3);
        }

        localLiveScoreStore[matchId] = updated;
        onUpdate(updated);
      }
    }
  }, 4000);

  return () => clearInterval(intervalId);
}

/**
 * Subscribe to real-time live score updates for a specific match.
 * Works with Firestore when configured, and falls back to a local simulated
 * live-tick otherwise (or if the real subscription errors out — e.g. missing
 * Firestore security rules — since onSnapshot reports failures via its error
 * callback asynchronously, not a synchronous throw).
 */
export function subscribeToLiveScore(
  matchId: number,
  onUpdate: (score: MultiSportLiveScore) => void
): () => void {
  if (!(isFirebaseConfigured && firestoreDb)) {
    return startLocalSimulation(matchId, onUpdate);
  }

  let stopped = false;
  let fallbackUnsubscribe: (() => void) | null = null;

  const matchRef = doc(firestoreDb, 'live_scores', String(matchId));
  const unsubscribeFirestore = onSnapshot(
    matchRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as MultiSportLiveScore);
      }
    },
    (error) => {
      console.warn(`[firebaseService] Firestore subscription failed for match ${matchId}, falling back to local simulation:`, error);
      if (!stopped) {
        fallbackUnsubscribe = startLocalSimulation(matchId, onUpdate);
      }
    }
  );

  return () => {
    stopped = true;
    unsubscribeFirestore();
    fallbackUnsubscribe?.();
  };
}

/**
 * Publish live score updates to Firebase Firestore or local realtime store.
 */
export async function publishLiveScoreUpdate(
  matchId: number,
  scoreData: Partial<MultiSportLiveScore>
): Promise<void> {
  const existing = localLiveScoreStore[matchId] || {};
  const merged = { ...existing, ...scoreData, match_id: matchId, last_updated: new Date().toISOString() };
  localLiveScoreStore[matchId] = merged as MultiSportLiveScore;

  if (isFirebaseConfigured && firestoreDb) {
    try {
      const matchRef = doc(firestoreDb, 'live_scores', String(matchId));
      await setDoc(matchRef, merged, { merge: true });
    } catch {
      // Fallback handled locally
    }
  }
}

/**
 * Pre-populate local live score store with rich multi-sport mock data matching the PDF sheets (Pages 1-16).
 */
export function seedInitialLiveScores(matches: any[]) {
  matches.forEach((m) => {
    const slug = m.sport?.slug || 'badminton';
    if (!localLiveScoreStore[m.id]) {
      localLiveScoreStore[m.id] = {
        match_id: m.id,
        sport_slug: slug,
        status: m.status || 'live',
        format: slug === 'badminton' ? 'Single' : slug === 'cricket' ? '50 Overs' : 'Standard',
        age_group: 'Under 17',
        category: 'District',
        date: '2026-08-07',
        venue: m.venue || 'Royal College Ground - Colombo',
        country: 'Sri Lanka',
        home_team: {
          name: m.home_team?.name || 'Amal Sampath',
          school_academy: 'Maristella College',
          club: 'Negombo BC',
          photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          players: [
            { id: '1', name: m.home_team?.name || 'Amal Sampath', photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
            { id: '2', name: 'Nimal Perera', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' }
          ]
        },
        away_team: {
          name: m.away_team?.name || 'Asanka Herath',
          school_academy: 'Ananda College',
          club: 'Colombo Sports Club',
          photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
          players: [
            { id: '3', name: m.away_team?.name || 'Asanka Herath', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
            { id: '4', name: 'Nishantha Silva', photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80' }
          ]
        },
        // All-zero until the match is actually started (via the admin panel
        // or, for this local-only fallback, the +Point dev buttons) — a
        // freshly created match has no score yet, not a fabricated demo one.
        racket_scores: {
          set1_home: 0,
          set1_away: 0,
          set2_home: 0,
          set2_away: 0,
          set3_home: 0,
          set3_away: 0,
          current_set: 1,
          points_home: 0,
          points_away: 0,
        },
        cricket_score: {
          batting_team: m.home_team?.name || '',
          bowling_team: m.away_team?.name || '',
          runs: 0,
          wickets: 0,
          overs: 0,
          summary: '',
        },
        judo_score: {
          home_ippon: 0,
          home_waza_ari: 0,
          home_yuko: 0,
          home_shido: 0,
          home_g_score: 0,
          away_ippon: 0,
          away_waza_ari: 0,
          away_yuko: 0,
          away_shido: 0,
          away_g_score: 0,
        },
        team_score: {
          home_total: 0,
          away_total: 0,
          home_sets_or_breakdown: [0, 0, 0, 0],
          away_sets_or_breakdown: [0, 0, 0, 0],
          outs_home: 0,
          outs_away: 0,
        }
      };
    }
  });
}
