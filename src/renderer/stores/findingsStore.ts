import { create } from 'zustand';
import type { Host, Service, Vuln, Credential, Chain, SessionLog, Approval } from '../../shared/types';
import { mockHosts, mockServices, mockVulns, mockCredentials, mockChains, mockSessionLog, mockApprovals } from '../api/mockData';

interface FindingsState {
  hosts: Host[];
  services: Service[];
  vulns: Vuln[];
  credentials: Credential[];
  chains: Chain[];
  sessionLog: SessionLog[];
  approvals: Approval[];
  loadFindings: (engagementId: string) => void;
  loadApprovals: (engagementId: string) => void;
  loadSessionLog: (engagementId: string) => void;
  bulkUpdateVulnStatus: (ids: number[], status: string) => void;
  approveCommand: (id: number) => void;
  denyCommand: (id: number) => void;
}

export const useFindingsStore = create<FindingsState>((set) => ({
  hosts: [], services: [], vulns: [], credentials: [], chains: [], sessionLog: [], approvals: [],
  loadFindings: (engagementId) => {
    const hosts = mockHosts.filter(h => h.engagement_id === engagementId);
    const hostIds = new Set(hosts.map(h => h.id));
    set({
      hosts,
      services: mockServices.filter(s => hostIds.has(s.host_id)),
      vulns: mockVulns.filter(v => v.engagement_id === engagementId),
      credentials: mockCredentials.filter(c => c.engagement_id === engagementId),
      chains: mockChains.filter(c => c.engagement_id === engagementId),
    });
  },
  loadApprovals: (engagementId) => {
    set({ approvals: mockApprovals.filter(a => a.engagement_id === engagementId) });
  },
  loadSessionLog: (engagementId) => {
    set({ sessionLog: mockSessionLog.filter(l => l.engagement_id === engagementId).reverse() });
  },
  bulkUpdateVulnStatus: (ids, status) => {
    set((s) => ({
      vulns: s.vulns.map(v => ids.includes(v.id) ? { ...v, status: status as any, updated_at: new Date().toISOString() } : v),
    }));
  },
  approveCommand: (id) => {
    set((s) => ({
      approvals: s.approvals.map(a => a.id === id ? { ...a, status: 'approved' as const, approved_by: 'operator', updated_at: new Date().toISOString() } : a),
    }));
  },
  denyCommand: (id) => {
    set((s) => ({
      approvals: s.approvals.map(a => a.id === id ? { ...a, status: 'denied' as const, approved_by: 'operator', reason: 'Denied by operator', updated_at: new Date().toISOString() } : a),
    }));
  },
}));
