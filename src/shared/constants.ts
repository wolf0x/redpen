export const TIER_2_AGENTS = [
  'recon-advisor',
  'vuln-scanner',
  'web-hunter',
  'ad-attacker',
  'exploit-chainer',
  'poc-validator',
  'bizlogic-hunter',
  'credential-tester',
];

export const HARD_REFUSAL_PATTERNS = [
  /masscan\s+.*0\.0\.0\.0\/0/i,
  /masscan\s+.*::\/0/i,
  /\|\s*(bash|sh|zsh)\b/,
  /eval\s*\(/,
  /rm\s+-rf\s+\/(?!\S)/,
  /hping3\s+.*--flood/i,
  /slowhttptest\s+.*-c\s+[5-9]\d{3,}/i,
  /--destructive/i,
  /dd\s+if=\/dev\/(zero|random|urandom)\s+of=/i,
  /:\(\)\s*\{.*\|.*\}.*;/,
];

export const NOISE_LEVELS = {
  QUIET: { label: 'Quiet', color: 'green', description: 'Passive recon, no packets sent' },
  MODERATE: { label: 'Moderate', color: 'orange', description: 'Active scanning, limited rate' },
  LOUD: { label: 'Loud', color: 'red', description: 'Aggressive scanning, may trigger IDS' },
} as const;

export const ENGAGEMENT_TYPES = [
  { value: 'external', label: 'External' },
  { value: 'internal', label: 'Internal' },
  { value: 'web', label: 'Web Application' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'wireless', label: 'Wireless' },
  { value: 'red-team', label: 'Red Team' },
] as const;

export const VULN_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;

export const SEVERITY_COLORS: Record<string, string> = {
  critical: '#cf1322',
  high: '#fa8c16',
  medium: '#fadb14',
  low: '#1890ff',
  info: '#8c8c8c',
};

export const PENTEST_PHASES = [
  { id: 'recon', label: 'Reconnaissance', order: 1 },
  { id: 'enum', label: 'Enumeration', order: 2 },
  { id: 'vuln-analysis', label: 'Vulnerability Analysis', order: 3 },
  { id: 'exploitation', label: 'Exploitation', order: 4 },
  { id: 'post-exploitation', label: 'Post-Exploitation', order: 5 },
  { id: 'reporting', label: 'Reporting', order: 6 },
] as const;
