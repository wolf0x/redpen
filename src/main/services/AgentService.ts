import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import type { AgentMeta } from '../../shared/types';

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
  'post-exploitation': ['post-exploit', 'privilege', 'lateral', 'pivot', 'c2'],
  planning: ['plan', 'scope', 'engagement', 'orchestrat', 'threat model'],
  defense: ['detect', 'forensic', 'yara', 'sigma', 'malware', 'splunk'],
  reporting: ['report', 'summary', 'handoff'],
  ai: ['llm', 'prompt', 'rag', 'ai', 'model'],
  compliance: ['stig', 'compliance', 'audit'],
  devsecops: ['cicd', 'pipeline', 'github', 'gitlab'],
  opsec: ['opsec', 'anonym', 'identity'],
  'reverse-engineering': ['reverse', 'ghidra', 'radare', 'binary', 'firmware'],
  training: ['ctf', 'hackthebox', 'tryhackme'],
  system: ['scope-guard'],
};

function deriveDomain(description: string, name: string): string {
  const text = `${description} ${name}`.toLowerCase();
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return domain;
  }
  return 'general';
}

class AgentService {
  private agentsDir: string;
  private agentCache: Map<string, AgentMeta> = new Map();
  private versionsDir: string;

  constructor(projectRoot?: string) {
    const root = projectRoot || path.resolve(process.cwd());
    this.agentsDir = path.join(root, '.claude', 'agents');
    this.versionsDir = path.join(root, 'data', 'agent-versions');
  }

  loadAgents(): AgentMeta[] {
    if (!fs.existsSync(this.agentsDir)) return [];

    const files = fs.readdirSync(this.agentsDir).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
    const agents: AgentMeta[] = [];

    for (const file of files) {
      const filePath = path.join(this.agentsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(content);

      const name = data.name || file.replace('.md', '');
      const description = data.description || '';
      const tools = typeof data.tools === 'string'
        ? data.tools.split(',').map((t: string) => t.trim())
        : Array.isArray(data.tools) ? data.tools : [];
      const model = data.model || 'claude-sonnet-4-5-20250514';

      const meta: AgentMeta = {
        name,
        description,
        tools,
        model,
        tier: TIER_2_AGENTS.has(name) ? 2 : 1,
        domain: deriveDomain(description, name),
        filePath: `.claude/agents/${file}`,
      };

      this.agentCache.set(name, meta);
      agents.push(meta);
    }

    return agents.sort((a, b) => a.name.localeCompare(b.name));
  }

  getAgent(name: string): AgentMeta | null {
    if (this.agentCache.size === 0) this.loadAgents();
    return this.agentCache.get(name) || null;
  }

  getAgentContent(name: string): { frontmatter: Record<string, unknown>; body: string } | null {
    const meta = this.getAgent(name);
    if (!meta) return null;

    const filePath = path.resolve(this.agentsDir, `${name}.md`);
    if (!fs.existsSync(filePath)) return null;

    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    return { frontmatter: data, body };
  }

  updateAgentPrompt(name: string, newBody: string): boolean {
    const meta = this.getAgent(name);
    if (!meta) return false;

    const filePath = path.resolve(this.agentsDir, `${name}.md`);
    if (!fs.existsSync(filePath)) return false;

    // Save version
    const current = fs.readFileSync(filePath, 'utf-8');
    const versionDir = path.join(this.versionsDir, name);
    if (!fs.existsSync(versionDir)) fs.mkdirSync(versionDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(versionDir, `${timestamp}.md`), current);

    // Write new content preserving frontmatter
    const { data } = matter(current);
    const frontmatter = ['---'];
    for (const [key, value] of Object.entries(data)) {
      frontmatter.push(`${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
    }
    frontmatter.push('---');

    fs.writeFileSync(filePath, `${frontmatter.join('\n')}\n\n${newBody}`);
    this.agentCache.delete(name);
    return true;
  }

  getAgentVersions(name: string): string[] {
    const versionDir = path.join(this.versionsDir, name);
    if (!fs.existsSync(versionDir)) return [];
    return fs.readdirSync(versionDir).filter((f) => f.endsWith('.md')).sort().reverse();
  }

  getAgentsByDomain(domain: string): AgentMeta[] {
    if (this.agentCache.size === 0) this.loadAgents();
    return Array.from(this.agentCache.values()).filter((a) => a.domain === domain);
  }

  getDomains(): string[] {
    if (this.agentCache.size === 0) this.loadAgents();
    const domains = new Set(Array.from(this.agentCache.values()).map((a) => a.domain));
    return Array.from(domains).sort();
  }
}

export default AgentService;
