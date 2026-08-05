import { create } from 'zustand';
import { secureStorage } from '../services/secureStorage';

const ONBOARDING_KEY = 'has_seen_onboarding';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  complete: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: false,
  isHydrating: true,

  hydrate: async () => {
    const value = await secureStorage.getItem(ONBOARDING_KEY);
    set({ hasSeenOnboarding: value === 'true', isHydrating: false });
  },

  complete: async () => {
    await secureStorage.setItem(ONBOARDING_KEY, 'true');
    set({ hasSeenOnboarding: true });
  },
}));
