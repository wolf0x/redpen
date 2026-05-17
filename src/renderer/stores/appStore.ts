import { create } from 'zustand';
import type { Engagement } from '../../shared/types';

interface AppState {
  lang: 'zh' | 'en';
  activeEngagement: Engagement | null;
  setLang: (lang: 'zh' | 'en') => void;
  setActiveEngagement: (engagement: Engagement | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  lang: (localStorage.getItem('redpen-lang') as 'zh' | 'en') || 'en',
  activeEngagement: null,
  setLang: (lang) => {
    localStorage.setItem('redpen-lang', lang);
    set({ lang });
  },
  setActiveEngagement: (engagement) => set({ activeEngagement: engagement }),
}));
