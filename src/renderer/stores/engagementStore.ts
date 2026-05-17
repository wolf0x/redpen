import { create } from 'zustand';
import type { Engagement, EngagementStats } from '../../shared/types';
import { mockEngagements, getEngagementStats } from '../api/mockData';

interface EngagementState {
  engagements: Engagement[];
  selectedId: string | null;
  stats: Record<string, EngagementStats>;
  loadEngagements: () => void;
  selectEngagement: (id: string | null) => void;
  createEngagement: (data: Partial<Engagement>) => void;
  updateEngagement: (id: string, data: Partial<Engagement>) => void;
}

export const useEngagementStore = create<EngagementState>((set, get) => ({
  engagements: [],
  selectedId: null,
  stats: {},
  loadEngagements: () => {
    const engagements = [...mockEngagements];
    const stats: Record<string, EngagementStats> = {};
    for (const e of engagements) stats[e.id] = getEngagementStats(e.id);
    set({ engagements, stats });
  },
  selectEngagement: (id) => set({ selectedId: id }),
  createEngagement: (data) => {
    const eng: Engagement = {
      id: `eng-${Date.now()}`, client: data.client || '', type: data.type || 'external',
      scope: data.scope || '', roe: data.roe || '', start_date: data.start_date || '',
      end_date: data.end_date || '', status: data.status || 'planning', notes: data.notes || '',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    set((s) => ({ engagements: [eng, ...s.engagements] }));
  },
  updateEngagement: (id, data) => {
    set((s) => ({
      engagements: s.engagements.map((e) => e.id === id ? { ...e, ...data, updated_at: new Date().toISOString() } : e),
    }));
  },
}));
