export interface Engagement {
  id: string;
  client: string;
  type: 'external' | 'internal' | 'web' | 'cloud' | 'wireless' | 'red-team';
  scope: string;
  roe: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Host {
  id: number;
  engagement_id: string;
  ip: string;
  hostname: string;
  os: string;
  role: string;
  status: 'discovered' | 'scanned' | 'vulnerable' | 'compromised' | 'pivoted';
  notes: string;
  discovered_by: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  host_id: number;
  port: number;
  protocol: string;
  service: string;
  version: string;
  banner: string;
  state: 'open' | 'closed' | 'filtered';
  created_at: string;
  updated_at: string;
}

export interface Vuln {
  id: number;
  host_id: number;
  service_id: number;
  engagement_id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss: number;
  cve: string;
  description: string;
  evidence_file: string;
  status: 'unconfirmed' | 'confirmed' | 'exploited' | 'mitigated';
  poc_output: string;
  mitre_id: string;
  tool_used: string;
  found_by: string;
  confirmed_by: string;
  created_at: string;
  updated_at: string;
}

export interface Credential {
  id: number;
  engagement_id: string;
  host_id: number;
  username: string;
  secret: string;
  secret_type: 'password' | 'hash' | 'token' | 'key' | 'certificate';
  domain: string;
  source: string;
  access_level: 'user' | 'admin' | 'system' | 'domain-admin';
  valid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Chain {
  id: number;
  engagement_id: string;
  name: string;
  score: number;
  status: 'partial' | 'complete' | 'validated';
  steps: string; // JSON string
  mitre_ids: string;
  created_at: string;
  updated_at: string;
}

export interface SessionLog {
  id: number;
  engagement_id: string;
  agent: string;
  action: string;
  summary: string;
  detail: string;
  created_at: string;
}

export interface Approval {
  id: number;
  engagement_id: string;
  command_text: string;
  agent: string;
  noise_level: 'QUIET' | 'MODERATE' | 'LOUD';
  status: 'pending' | 'approved' | 'denied' | 'executed';
  requested_by: string;
  approved_by: string;
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface TaskState {
  id: number;
  engagement_id: string;
  agent: string;
  task_description: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at: string;
  result_summary: string;
  evidence_files: string; // JSON string
}

export interface ConfigVersion {
  id: number;
  engagement_id: string;
  config_key: string;
  config_value: string; // JSON string
  version: number;
  created_at: string;
}

export interface AgentMeta {
  name: string;
  description: string;
  tools: string[];
  model: string;
  tier: 1 | 2;
  domain: string;
  filePath: string;
}

export interface EngagementStats {
  host_count: number;
  service_count: number;
  vuln_count: { critical: number; high: number; medium: number; low: number; info: number };
  credential_count: number;
  chain_count: number;
  chain_completion: number;
  confirmation_rate: number;
}

export interface ScopeEntry {
  type: 'ip' | 'cidr' | 'domain' | 'url';
  value: string;
  valid: boolean;
}

export interface ScopeDefinition {
  entries: ScopeEntry[];
  raw: string;
}

export type NoiseLevel = 'QUIET' | 'MODERATE' | 'LOUD';

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  evidenceFile: string;
}

// IPC API type for renderer
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, callback: (...args: unknown[]) => void) => void;
      off: (channel: string) => void;
    };
  }
}
