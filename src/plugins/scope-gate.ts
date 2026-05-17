import type { PluginHook, PluginContext, PluginResult } from './types';
import { HARD_REFUSAL_PATTERNS } from '../shared/constants';

function extractTargets(command: string): string[] {
  const targets: string[] = [];
  // IP addresses
  const ipRegex = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\/\d{1,2})?)\b/g;
  let match;
  while ((match = ipRegex.exec(command)) !== null) {
    // Filter out version strings (e.g., "nmap 7.92")
    const prefix = command[Math.max(0, match.index - 1)];
    if (prefix && /\d/.test(prefix)) continue;
    targets.push(match[1]);
  }
  // Domains (heuristic: contains a dot and no spaces around it)
  const domainRegex = /\b([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g;
  while ((match = domainRegex.exec(command)) !== null) {
    // Skip common non-target domains and file extensions
    if (/^(github|npmjs|google|localhost|example)\.(com|org|net|io)$/.test(match[0])) continue;
    if (/\.(py|js|ts|sh|rb|go|rs|c|cpp|java|class|jar|log|txt|md|json|yaml|yml|xml|html|css|conf|cfg|ini|toml|lock)$/i.test(match[0])) continue;
    targets.push(match[0]);
  }
  return [...new Set(targets)];
}

function checkHardRefusal(command: string): { refused: boolean; reason: string } {
  for (const pattern of HARD_REFUSAL_PATTERNS) {
    if (pattern.test(command)) {
      return { refused: true, reason: `Hard refusal: command matches forbidden pattern ${pattern.source}` };
    }
  }
  return { refused: false, reason: '' };
}

function isInScope(target: string, scope: PluginContext['scope']): boolean {
  if (!scope.entries || scope.entries.length === 0) return false;

  for (const entry of scope.entries) {
    if (entry.type === 'ip' && target === entry.value) return true;
    if (entry.type === 'cidr' && isIpInCidr(target, entry.value)) return true;
    if (entry.type === 'domain' && (target === entry.value || target.endsWith('.' + entry.value))) return true;
  }
  return false;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [network, prefixLen] = cidr.split('/');
  if (!prefixLen) return ip === network;

  const ipNum = ipToNum(ip);
  const netNum = ipToNum(network);
  const mask = ~((1 << (32 - parseInt(prefixLen))) - 1);
  return (ipNum & mask) === (netNum & mask);
}

function ipToNum(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

const scopeGate: PluginHook = {
  name: 'scope-gate',
  event: 'tool.execute.before',
  async handle(context: PluginContext): Promise<PluginResult> {
    const { command, scope } = context;

    // Check hard refusal patterns
    const refusal = checkHardRefusal(command);
    if (refusal.refused) {
      return { allowed: false, reason: refusal.reason };
    }

    // Extract targets and validate against scope
    const targets = extractTargets(command);
    if (targets.length === 0) {
      // No targets found, allow (probably a local command)
      return { allowed: true };
    }

    if (!scope || !scope.entries || scope.entries.length === 0) {
      return { allowed: false, reason: 'No scope declared for this engagement. Cannot execute commands against targets without a defined scope.' };
    }

    for (const target of targets) {
      if (!isInScope(target, scope)) {
        return { allowed: false, reason: `Target "${target}" is outside the declared engagement scope. Refusing to execute.` };
      }
    }

    return { allowed: true };
  },
};

export default scopeGate;
