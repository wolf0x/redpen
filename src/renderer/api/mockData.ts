import type { Engagement, Host, Service, Vuln, Credential, Chain, SessionLog, Approval, AgentMeta, EngagementStats } from '../../shared/types';

export const mockEngagements: Engagement[] = [
  {
    id: 'eng-001', client: 'Acme Corp', type: 'external', scope: '203.0.113.0/24, acme-corp.com',
    roe: 'No DoS, no social engineering of employees', start_date: '2026-05-01', end_date: '2026-05-30',
    status: 'active', notes: 'External perimeter + web app', created_at: '2026-05-01T09:00:00Z', updated_at: '2026-05-15T14:30:00Z',
  },
  {
    id: 'eng-002', client: 'Globex Inc', type: 'internal', scope: '10.0.0.0/16, 172.16.0.0/12',
    roe: 'Full scope internal, no production DB writes', start_date: '2026-04-15', end_date: '2026-06-15',
    status: 'active', notes: 'AD-focused internal pentest', created_at: '2026-04-15T09:00:00Z', updated_at: '2026-05-14T18:00:00Z',
  },
  {
    id: 'eng-003', client: 'StartupXYZ', type: 'web', scope: 'app.startupxyz.io, api.startupxyz.io',
    roe: 'Web app only, no infrastructure', start_date: '2026-03-01', end_date: '2026-03-31',
    status: 'completed', notes: 'OWASP Top 10 assessment', created_at: '2026-03-01T09:00:00Z', updated_at: '2026-03-31T17:00:00Z',
  },
];

export const mockHosts: Host[] = [
  { id: 1, engagement_id: 'eng-001', ip: '203.0.113.10', hostname: 'web01.acme-corp.com', os: 'Ubuntu 22.04', role: 'web-server', status: 'scanned', notes: 'Nginx + PHP', discovered_by: 'nmap', created_at: '2026-05-02T10:00:00Z', updated_at: '2026-05-02T10:00:00Z' },
  { id: 2, engagement_id: 'eng-001', ip: '203.0.113.20', hostname: 'mail.acme-corp.com', os: 'Windows Server 2019', role: 'mail-server', status: 'vulnerable', notes: 'Exchange 2019', discovered_by: 'nmap', created_at: '2026-05-02T10:05:00Z', updated_at: '2026-05-10T14:00:00Z' },
  { id: 3, engagement_id: 'eng-001', ip: '203.0.113.30', hostname: 'vpn.acme-corp.com', os: 'FortiOS 7.2', role: 'vpn-gateway', status: 'discovered', notes: 'FortiGate SSL VPN', discovered_by: 'shodan', created_at: '2026-05-03T08:00:00Z', updated_at: '2026-05-03T08:00:00Z' },
  { id: 4, engagement_id: 'eng-002', ip: '10.0.0.5', hostname: 'dc01.globex.local', os: 'Windows Server 2022', role: 'domain-controller', status: 'compromised', notes: 'Primary DC, obtained Domain Admin', discovered_by: 'bloodhound', created_at: '2026-04-20T09:00:00Z', updated_at: '2026-05-10T16:00:00Z' },
  { id: 5, engagement_id: 'eng-002', ip: '10.0.0.15', hostname: 'file01.globex.local', os: 'Windows Server 2019', role: 'file-server', status: 'scanned', notes: 'SMB shares', discovered_by: 'nmap', created_at: '2026-04-22T11:00:00Z', updated_at: '2026-04-22T11:00:00Z' },
];

export const mockServices: Service[] = [
  { id: 1, host_id: 1, port: 80, protocol: 'tcp', service: 'http', version: 'Nginx 1.24', banner: '', state: 'open', created_at: '2026-05-02T10:10:00Z', updated_at: '2026-05-02T10:10:00Z' },
  { id: 2, host_id: 1, port: 443, protocol: 'tcp', service: 'https', version: 'Nginx 1.24', banner: '', state: 'open', created_at: '2026-05-02T10:10:00Z', updated_at: '2026-05-02T10:10:00Z' },
  { id: 3, host_id: 2, port: 443, protocol: 'tcp', service: 'https', version: 'Exchange 2019 CU13', banner: '', state: 'open', created_at: '2026-05-02T10:15:00Z', updated_at: '2026-05-02T10:15:00Z' },
  { id: 4, host_id: 2, port: 25, protocol: 'tcp', service: 'smtp', version: 'Exchange 2019', banner: '220 mail.acme-corp.com', state: 'open', created_at: '2026-05-02T10:15:00Z', updated_at: '2026-05-02T10:15:00Z' },
  { id: 5, host_id: 4, port: 445, protocol: 'tcp', service: 'microsoft-ds', version: 'Windows Server 2022', banner: '', state: 'open', created_at: '2026-04-20T09:05:00Z', updated_at: '2026-04-20T09:05:00Z' },
  { id: 6, host_id: 4, port: 389, protocol: 'tcp', service: 'ldap', version: 'Active Directory', banner: '', state: 'open', created_at: '2026-04-20T09:05:00Z', updated_at: '2026-04-20T09:05:00Z' },
];

export const mockVulns: Vuln[] = [
  { id: 1, host_id: 2, service_id: 3, engagement_id: 'eng-001', title: 'Exchange ProxyNotShell (CVE-2022-41040)', severity: 'critical', cvss: 9.8, cve: 'CVE-2022-41040', description: 'Server-side request forgery in Exchange allowing RCE', evidence_file: 'nmap_mail_20260510.log', status: 'confirmed', poc_output: 'curl -k https://mail.acme-corp.com/autodiscover/autodiscover.json', mitre_id: 'T1190', tool_used: 'nuclei', found_by: 'vuln-scanner', confirmed_by: 'poc-validator', created_at: '2026-05-10T14:00:00Z', updated_at: '2026-05-12T09:00:00Z' },
  { id: 2, host_id: 1, service_id: 2, engagement_id: 'eng-001', title: 'SQL Injection in login form', severity: 'high', cvss: 8.1, cve: '', description: 'Blind SQL injection via username parameter', evidence_file: 'sqlmap_web01_20260508.log', status: 'confirmed', poc_output: "sqlmap -u 'https://acme-corp.com/login' --data='user=admin&pass=test' --level=5", mitre_id: 'T1190', tool_used: 'sqlmap', found_by: 'web-hunter', confirmed_by: 'poc-validator', created_at: '2026-05-08T11:00:00Z', updated_at: '2026-05-09T15:00:00Z' },
  { id: 3, host_id: 4, service_id: 5, engagement_id: 'eng-002', title: 'Kerberoasting - Weak Service Account Passwords', severity: 'high', cvss: 7.5, cve: '', description: 'Multiple service accounts with weak passwords cracked via Kerberoasting', evidence_file: 'kerberoast_20260505.log', status: 'exploited', poc_output: 'hashcat -m 13100 hashes.txt rockyou.txt', mitre_id: 'T1558.003', tool_used: 'impacket', found_by: 'ad-attacker', confirmed_by: 'credential-tester', created_at: '2026-05-05T16:00:00Z', updated_at: '2026-05-08T10:00:00Z' },
  { id: 4, host_id: 1, service_id: 1, engagement_id: 'eng-001', title: 'Missing Security Headers', severity: 'low', cvss: 3.1, cve: '', description: 'X-Frame-Options, CSP, HSTS headers missing', evidence_file: 'curl_headers_20260503.log', status: 'confirmed', poc_output: '', mitre_id: '', tool_used: 'curl', found_by: 'recon-advisor', confirmed_by: '', created_at: '2026-05-03T12:00:00Z', updated_at: '2026-05-03T12:00:00Z' },
  { id: 5, host_id: 3, service_id: 0, engagement_id: 'eng-001', title: 'Fortinet SSL VPN Pre-auth RCE (CVE-2023-27997)', severity: 'critical', cvss: 9.8, cve: 'CVE-2023-27997', description: 'Heap-based buffer overflow in FortiOS SSL VPN', evidence_file: 'nmap_vpn_20260514.log', status: 'unconfirmed', poc_output: '', mitre_id: 'T1190', tool_used: 'nuclei', found_by: 'vuln-scanner', confirmed_by: '', created_at: '2026-05-14T09:00:00Z', updated_at: '2026-05-14T09:00:00Z' },
];

export const mockCredentials: Credential[] = [
  { id: 1, engagement_id: 'eng-002', host_id: 4, username: 'svc_backup', secret: 'P@ssw0rd123!', secret_type: 'password', domain: 'globex.local', source: 'kerberoasting', access_level: 'user', valid: true, created_at: '2026-05-05T16:30:00Z', updated_at: '2026-05-06T09:00:00Z' },
  { id: 2, engagement_id: 'eng-002', host_id: 4, username: 'svc_sql', secret: 'Summer2024', secret_type: 'password', domain: 'globex.local', source: 'kerberoasting', access_level: 'user', valid: true, created_at: '2026-05-05T16:30:00Z', updated_at: '2026-05-06T09:00:00Z' },
  { id: 3, engagement_id: 'eng-002', host_id: 4, username: 'administrator', secret: 'aad3b435b51404eeaad3b435b51404ee:da39a3ee5e6b4b0d3255bfef95601890', secret_type: 'hash', domain: 'globex.local', source: 'dcsync', access_level: 'domain-admin', valid: true, created_at: '2026-05-10T16:00:00Z', updated_at: '2026-05-10T16:00:00Z' },
];

export const mockChains: Chain[] = [
  { id: 1, engagement_id: 'eng-002', name: 'Kerberoast → DA Compromise', score: 9.0, status: 'complete', steps: JSON.stringify([
    { phase: 'enum', action: 'Enumerate SPNs via BloodHound', mitre: 'T1082' },
    { phase: 'exploitation', action: 'Request TGS for service accounts', mitre: 'T1558.003' },
    { phase: 'exploitation', action: 'Crack service account hashes offline', mitre: 'T1110.002' },
    { phase: 'post-exploitation', action: 'Pivot to file server with svc_backup creds', mitre: 'T1021.002' },
    { phase: 'post-exploitation', action: 'DCSync attack to obtain admin hash', mitre: 'T1003.006' },
  ]), mitre_ids: 'T1082,T1558.003,T1110.002,T1021.002,T1003.006', created_at: '2026-05-05T17:00:00Z', updated_at: '2026-05-10T16:30:00Z' },
];

export const mockSessionLog: SessionLog[] = [
  { id: 1, engagement_id: 'eng-001', agent: 'recon-advisor', action: 'executed', summary: 'Nmap full port scan on 203.0.113.0/24', detail: 'nmap -sV -p- --min-rate 1000 203.0.113.0/24', created_at: '2026-05-02T10:00:00Z' },
  { id: 2, engagement_id: 'eng-001', agent: 'vuln-scanner', action: 'executed', summary: 'Nuclei scan on web01.acme-corp.com', detail: 'nuclei -u https://web01.acme-corp.com -t cves/', created_at: '2026-05-03T14:00:00Z' },
  { id: 3, engagement_id: 'eng-001', agent: 'web-hunter', action: 'executed', summary: 'SQLMap scan on login form', detail: "sqlmap -u 'https://acme-corp.com/login' --data='user=admin&pass=test'", created_at: '2026-05-08T11:00:00Z' },
  { id: 4, engagement_id: 'eng-001', agent: 'vuln-scanner', action: 'executed', summary: 'Nuclei scan on Exchange server', detail: 'nuclei -u https://mail.acme-corp.com -t cves/', created_at: '2026-05-10T13:00:00Z' },
  { id: 5, engagement_id: 'eng-002', agent: 'ad-attacker', action: 'executed', summary: 'BloodHound collection', detail: 'bloodhound-python -d globex.local -u svc_scan -p xxx -c All', created_at: '2026-04-25T10:00:00Z' },
  { id: 6, engagement_id: 'eng-002', agent: 'ad-attacker', action: 'executed', summary: 'Kerberoasting attack', detail: 'impacket-GetUserSPNs globex.local/svc_scan -request', created_at: '2026-05-05T15:00:00Z' },
  { id: 7, engagement_id: 'eng-002', agent: 'credential-tester', action: 'executed', summary: 'Hash cracking - Kerberoast hashes', detail: 'hashcat -m 13100 hashes.txt rockyou.txt', created_at: '2026-05-05T16:00:00Z' },
  { id: 8, engagement_id: 'eng-002', agent: 'ad-attacker', action: 'executed', summary: 'DCSync attack', detail: 'secretsdump.py globex.local/svc_backup:xxx@10.0.0.5', created_at: '2026-05-10T16:00:00Z' },
];

export const mockApprovals: Approval[] = [
  { id: 1, engagement_id: 'eng-001', command_text: 'nmap -sV -p 1-65535 --min-rate 2000 203.0.113.0/24', agent: 'recon-advisor', noise_level: 'LOUD', status: 'pending', requested_by: 'recon-advisor', approved_by: '', reason: '', created_at: '2026-05-15T09:00:00Z', updated_at: '2026-05-15T09:00:00Z' },
  { id: 2, engagement_id: 'eng-001', command_text: 'nuclei -u https://mail.acme-corp.com -t cves/ -severity critical,high', agent: 'vuln-scanner', noise_level: 'MODERATE', status: 'pending', requested_by: 'vuln-scanner', approved_by: '', reason: '', created_at: '2026-05-15T10:30:00Z', updated_at: '2026-05-15T10:30:00Z' },
  { id: 3, engagement_id: 'eng-002', command_text: 'crackmapexec smb 10.0.0.0/24 -u svc_backup -p \'P@ssw0rd123!\' --shares', agent: 'ad-attacker', noise_level: 'MODERATE', status: 'approved', requested_by: 'ad-attacker', approved_by: 'operator', reason: '', created_at: '2026-05-14T14:00:00Z', updated_at: '2026-05-14T14:05:00Z' },
];

export const mockAgents: AgentMeta[] = [
  { name: 'recon-advisor', description: 'Parses Nmap/Nessus/BloodHound output, prioritizes targets. Tier 2: executes recon tools.', tools: ['Bash', 'Read', 'Grep', 'Glob', 'WebFetch'], model: 'claude-sonnet-4-5-20250514', tier: 2, domain: 'recon', filePath: '.claude/agents/recon-advisor.md' },
  { name: 'vuln-scanner', description: 'Nuclei, Nikto, Nmap NSE scans. Tier 2: executes scanning tools.', tools: ['Bash', 'Read', 'Grep', 'Glob'], model: 'claude-sonnet-4-5-20250514', tier: 2, domain: 'scanning', filePath: '.claude/agents/vuln-scanner.md' },
  { name: 'web-hunter', description: 'ffuf, gobuster, sqlmap, dalfox for web application testing.', tools: ['Bash', 'Read', 'Grep', 'Glob', 'WebFetch'], model: 'claude-sonnet-4-5-20250514', tier: 2, domain: 'web', filePath: '.claude/agents/web-hunter.md' },
  { name: 'ad-attacker', description: 'BloodHound, Impacket, CrackMapExec, Certipy for AD pentesting.', tools: ['Bash', 'Read', 'Grep', 'Glob'], model: 'claude-sonnet-4-5-20250514', tier: 2, domain: 'ad', filePath: '.claude/agents/ad-attacker.md' },
  { name: 'osint-collector', description: 'Domain recon, email harvesting, social media profiling, breach data analysis.', tools: ['WebFetch', 'WebSearch', 'Read', 'Grep', 'Glob'], model: 'claude-sonnet-4-5-20250514', tier: 1, domain: 'recon', filePath: '.claude/agents/osint-collector.md' },
  { name: 'engagement-planner', description: 'Creates phased pentest plans with MITRE ATT&CK mappings, time estimates, ROE templates.', tools: ['Read', 'Grep', 'Glob', 'WebFetch'], model: 'claude-sonnet-4-5-20250514', tier: 1, domain: 'planning', filePath: '.claude/agents/engagement-planner.md' },
  { name: 'threat-modeler', description: 'STRIDE/DREAD analysis, attack trees, data flow diagrams.', tools: ['Read', 'Grep', 'Glob', 'Write'], model: 'claude-sonnet-4-5-20250514', tier: 1, domain: 'planning', filePath: '.claude/agents/threat-modeler.md' },
  { name: 'api-security', description: 'REST, GraphQL, WebSocket testing; OWASP API Top 10, JWT attacks.', tools: ['Bash', 'Read', 'Grep', 'WebFetch'], model: 'claude-sonnet-4-5-20250514', tier: 1, domain: 'web', filePath: '.claude/agents/api-security.md' },
  { name: 'cloud-security', description: 'AWS/Azure/GCP pentesting: IAM escalation, container escape.', tools: ['Bash', 'Read', 'Grep', 'WebFetch'], model: 'claude-sonnet-4-5-20250514', tier: 1, domain: 'cloud', filePath: '.claude/agents/cloud-security.md' },
  { name: 'exploit-chainer', description: 'Chains low-severity findings into full compromise paths.', tools: ['Bash', 'Read', 'Grep', 'Write'], model: 'claude-sonnet-4-5-20250514', tier: 2, domain: 'post-exploitation', filePath: '.claude/agents/exploit-chainer.md' },
  { name: 'poc-validator', description: 'Generates and safely executes PoC scripts.', tools: ['Bash', 'Read', 'Write', 'Grep'], model: 'claude-sonnet-4-5-20250514', tier: 2, domain: 'exploitation', filePath: '.claude/agents/poc-validator.md' },
  { name: 'credential-tester', description: 'Hydra, Hashcat, John; hash identification, wordlist generation.', tools: ['Bash', 'Read', 'Grep', 'Write'], model: 'claude-sonnet-4-5-20250514', tier: 2, domain: 'exploitation', filePath: '.claude/agents/credential-tester.md' },
  { name: 'report-generator', description: 'Professional pentest reports with executive summaries, CVSS scoring.', tools: ['Read', 'Write', 'Grep', 'Glob'], model: 'claude-sonnet-4-5-20250514', tier: 1, domain: 'reporting', filePath: '.claude/agents/report-generator.md' },
  { name: 'detection-engineer', description: 'Sigma, Splunk SPL, Elastic KQL, Sentinel KQL rules with FP tuning.', tools: ['Read', 'Write', 'Grep', 'Bash'], model: 'claude-sonnet-4-5-20250514', tier: 1, domain: 'defense', filePath: '.claude/agents/detection-engineer.md' },
  { name: 'malware-analyst', description: 'Static/dynamic analysis, YARA rules, IOC extraction.', tools: ['Bash', 'Read', 'Write', 'Grep'], model: 'claude-sonnet-4-5-20250514', tier: 1, domain: 'defense', filePath: '.claude/agents/malware-analyst.md' },
];

export function getEngagementStats(engagementId: string): EngagementStats {
  const hosts = mockHosts.filter(h => h.engagement_id === engagementId);
  const vulns = mockVulns.filter(v => v.engagement_id === engagementId);
  const creds = mockCredentials.filter(c => c.engagement_id === engagementId);
  const chains = mockChains.filter(c => c.engagement_id === engagementId);

  const vuln_count = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const v of vulns) (vuln_count as Record<string, number>)[v.severity]++;

  const confirmed = vulns.filter(v => v.status === 'confirmed' || v.status === 'exploited').length;
  const completedChains = chains.filter(c => c.status === 'complete').length;

  return {
    host_count: hosts.length,
    service_count: mockServices.filter(s => hosts.some(h => h.id === s.host_id)).length,
    vuln_count,
    credential_count: creds.length,
    chain_count: chains.length,
    chain_completion: chains.length > 0 ? Math.round((completedChains / chains.length) * 100) : 0,
    confirmation_rate: vulns.length > 0 ? Math.round((confirmed / vulns.length) * 100) : 0,
  };
}
