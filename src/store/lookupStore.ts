import { create } from 'zustand';
import { lookupService } from '../services/lookupService';
import { Lookups } from '../types';

interface LookupState {
  lookups: Lookups | null;
  isLoading: boolean;
  error: string | null;
  /** Fetches once and caches — safe to call from every screen that needs a dropdown. */
  ensureLoaded: () => Promise<void>;
}

export const useLookupStore = create<LookupState>((set, get) => ({
  lookups: null,
  isLoading: false,
  error: null,

  ensureLoaded: async () => {
    if (get().lookups || get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const lookups = await lookupService.fetchAll();
      set({ lookups, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Could not load form options. Pull to retry.' });
    }
  },
}));
