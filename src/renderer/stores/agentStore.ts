import { create } from 'zustand';
import type { AgentMeta } from '../../shared/types';
import { mockAgents } from '../api/mockData';

interface AgentState {
  agents: AgentMeta[];
  selectedAgent: AgentMeta | null;
  domains: string[];
  filterDomain: string;
  loadAgents: () => void;
  selectAgent: (agent: AgentMeta | null) => void;
  setFilterDomain: (domain: string) => void;
  getFilteredAgents: () => AgentMeta[];
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  selectedAgent: null,
  domains: [],
  filterDomain: '',
  loadAgents: () => {
    const agents = [...mockAgents];
    const domains = [...new Set(agents.map(a => a.domain))].sort();
    set({ agents, domains });
  },
  selectAgent: (agent) => set({ selectedAgent: agent }),
  setFilterDomain: (domain) => set({ filterDomain: domain }),
  getFilteredAgents: () => {
    const { agents, filterDomain } = get();
    if (!filterDomain) return agents;
    return agents.filter(a => a.domain === filterDomain);
  },
}));
