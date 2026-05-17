import type { Engagement, ScopeEntry, ScopeDefinition } from '../../shared/types';

class ScopeService {
  parseScope(scopeText: string): ScopeDefinition {
    const entries: ScopeEntry[] = [];
    const parts = scopeText.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (this.isCidr(part)) {
        entries.push({ type: 'cidr', value: part, valid: true });
      } else if (this.isIp(part)) {
        entries.push({ type: 'ip', value: part, valid: true });
      } else if (this.isDomain(part)) {
        entries.push({ type: 'domain', value: part, valid: true });
      } else if (this.isUrl(part)) {
        entries.push({ type: 'url', value: part, valid: true });
      } else {
        entries.push({ type: 'ip', value: part, valid: false });
      }
    }

    return { entries, raw: scopeText };
  }

  validateScope(scopeDef: ScopeDefinition, target: string): boolean {
    if (!scopeDef.entries || scopeDef.entries.length === 0) return false;

    for (const entry of scopeDef.entries) {
      if (!entry.valid) continue;
      if (entry.type === 'ip' && target === entry.value) return true;
      if (entry.type === 'cidr' && this.isIpInCidr(target, entry.value)) return true;
      if (entry.type === 'domain' && (target === entry.value || target.endsWith('.' + entry.value))) return true;
      if (entry.type === 'url' && target.includes(entry.value)) return true;
    }
    return false;
  }

  validateScopeForEngagement(engagement: Engagement, target: string): boolean {
    const scopeDef = this.parseScope(engagement.scope);
    return this.validateScope(scopeDef, target);
  }

  checkConflict(newScope: string, existingEngagements: Engagement[]): string[] {
    const conflicts: string[] = [];
    const newEntries = this.parseScope(newScope);

    for (const eng of existingEngagements) {
      if (eng.status === 'completed' || eng.status === 'archived') continue;
      const existingEntries = this.parseScope(eng.scope);

      for (const newE of newEntries.entries) {
        for (const existE of existingEntries.entries) {
          if (newE.value === existE.value) {
            conflicts.push(`"${newE.value}" overlaps with engagement "${eng.client}" (${eng.id})`);
          }
          if (newE.type === 'cidr' && existE.type === 'cidr' && this.cidrsOverlap(newE.value, existE.value)) {
            conflicts.push(`CIDR ${newE.value} overlaps with ${existE.value} in engagement "${eng.client}"`);
          }
        }
      }
    }

    return conflicts;
  }

  private isIp(s: string): boolean {
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s);
  }

  private isCidr(s: string): boolean {
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(s);
  }

  private isDomain(s: string): boolean {
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(s);
  }

  private isUrl(s: string): boolean {
    return /^https?:\/\//.test(s);
  }

  private isIpInCidr(ip: string, cidr: string): boolean {
    const [network, prefixLen] = cidr.split('/');
    if (!prefixLen) return ip === network;
    const ipNum = this.ipToNum(ip);
    const netNum = this.ipToNum(network);
    const mask = ~((1 << (32 - parseInt(prefixLen))) - 1);
    return (ipNum & mask) === (netNum & mask);
  }

  private ipToNum(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  private cidrsOverlap(cidr1: string, cidr2: string): boolean {
    const [net1, len1] = cidr1.split('/');
    const [net2, len2] = cidr2.split('/');
    const mask = Math.min(parseInt(len1), parseInt(len2));
    const m = ~((1 << (32 - mask)) - 1);
    return (this.ipToNum(net1) & m) === (this.ipToNum(net2) & m);
  }
}

export default ScopeService;
