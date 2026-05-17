import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

interface AgentMeta {
  name: string;
  description: string;
  tools: string[];
  model: string;
  tier: 1 | 2;
  domain: string;
  filePath: string;
}

const TIER_2_AGENTS = new Set([
  'recon-advisor', 'vuln-scanner', 'web-hunter', 'ad-attacker',
  'exploit-chainer', 'poc-validator', 'bizlogic-hunter', 'credential-tester',
]);

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  recon: ['recon', 'nmap', 'scan', 'osint', 'enumeration'],
  web: ['web', 'http', 'api', 'sql', 'xss', 'ssrf', 'graphql'],
  exploitation: ['exploit', 'poc', 'payload', 'vulnerability', 'crack', 'hashcat'],
  ad: ['active directory', 'bloodhound', 'kerberos', 'ldap', 'impacket'],
  cloud: ['aws', 'azure', 'gcp', 'cloud', 'container', 'kubernetes', 'docker'],
  mobile: ['android', 'ios', 'mobile', 'frida', 'apk'],
  wireless: ['wifi', 'wireless', 'wpa', 'bluetooth'],
  'social-engineering': ['phishing', 'social', 'vishing', 'pretexting'],
  'post-exploitation': ['post-exploit', 'privilege', 'lateral', 'pivot', 'c2', 'beacon'],
  planning: ['plan', 'scope', 'engagement', 'orchestrat', 'threat model'],
  defense: ['detect', 'forensic', 'yara', 'sigma', 'malware', 'splunk'],
  reporting: ['report', 'summary', 'handoff', 'executive'],
  compliance: ['stig', 'compliance', 'audit', 'remediation'],
  ai: ['llm', 'prompt', 'rag', 'ai', 'model'],
  devsecops: ['cicd', 'pipeline', 'github', 'gitlab', 'jenkins'],
  opsec: ['opsec', 'anonym', 'identity', 'fingerprint'],
  'reverse-engineering': ['reverse', 'ghidra', 'radare', 'binary', 'firmware', 'disassembl'],
  training: ['ctf', 'hackthebox', 'tryhackme', 'challenge'],
  system: ['scope-guard', 'system'],
};

function deriveDomain(description: string, name: string): string {
  const text = `${description} ${name}`.toLowerCase();
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return domain;
    }
  }
  return 'general';
}

function parseAgents(agentsDir: string): AgentMeta[] {
  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  const agents: AgentMeta[] = [];

  for (const file of files) {
    if (file.startsWith('_')) continue; // skip _scope-guard

    const filePath = path.join(agentsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);

    const name = data.name || file.replace('.md', '');
    const description = data.description || '';
    const tools = typeof data.tools === 'string'
      ? data.tools.split(',').map((t: string) => t.trim())
      : Array.isArray(data.tools) ? data.tools : [];
    const model = data.model || 'claude-sonnet-4-5-20250514';

    agents.push({
      name,
      description,
      tools,
      model,
      tier: TIER_2_AGENTS.has(name) ? 2 : 1,
      domain: deriveDomain(description, name),
      filePath: `.claude/agents/${file}`,
    });
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

const agentsDir = path.resolve(__dirname, '..', '.claude', 'agents');
const meta = parseAgents(agentsDir);

const outputPath = path.resolve(__dirname, '..', 'src', 'shared', 'agents-meta.json');
fs.writeFileSync(outputPath, JSON.stringify(meta, null, 2));
console.log(`Parsed ${meta.length} agents -> ${outputPath}`);
