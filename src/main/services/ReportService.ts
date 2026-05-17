import * as fs from 'fs';
import * as path from 'path';
import DatabaseService from './DatabaseService';
import type { Engagement, Vuln, Host, Credential, Chain, SessionLog } from '../../shared/types';

interface ReportData {
  engagement: Engagement;
  hosts: Host[];
  vulns: Vuln[];
  credentials: Credential[];
  chains: Chain[];
  sessionLog: SessionLog[];
  generatedAt: string;
}

type ReportType = 'technical' | 'executive' | 'handoff';

class ReportService {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  generateReport(engagementId: string, type: ReportType): ReportData {
    const data: ReportData = {
      engagement: this.db.getEngagement(engagementId),
      hosts: this.db.listHosts(engagementId),
      vulns: this.db.listVulns(engagementId),
      credentials: this.db.listCredentials(engagementId),
      chains: this.db.listChains(engagementId),
      sessionLog: this.db.getSessionLog(engagementId, 1000),
      generatedAt: new Date().toISOString(),
    };
    return data;
  }

  exportMarkdown(data: ReportData, type: ReportType): string {
    const sections: string[] = [];

    sections.push(`# ${this.getReportTitle(type)}`);
    sections.push('');
    sections.push(`**Engagement:** ${data.engagement.client}`);
    sections.push(`**Type:** ${data.engagement.type}`);
    sections.push(`**Scope:** ${data.engagement.scope}`);
    sections.push(`**Generated:** ${data.generatedAt}`);
    sections.push('');

    if (type === 'executive') {
      return this.renderExecutive(sections, data);
    } else if (type === 'handoff') {
      return this.renderHandoff(sections, data);
    }
    return this.renderTechnical(sections, data);
  }

  private getReportTitle(type: ReportType): string {
    switch (type) {
      case 'technical': return 'Technical Penetration Test Report';
      case 'executive': return 'Executive Summary';
      case 'handoff': return 'Session Handoff Report';
    }
  }

  private renderTechnical(sections: string[], data: ReportData): string {
    // Scope section
    sections.push('## 1. Scope & Methodology', '');
    sections.push('### Scope', data.engagement.scope, '');
    sections.push('### Methodology', 'Testing followed industry-standard methodologies including OWASP, PTES, and MITRE ATT&CK.', '');

    // Findings summary
    sections.push('## 2. Findings Summary', '');
    const bySeverity = this.groupBySeverity(data.vulns);
    sections.push('| Severity | Count |', '|----------|-------|');
    for (const [sev, count] of Object.entries(bySeverity)) {
      sections.push(`| ${sev} | ${count} |`);
    }
    sections.push('');

    // Detailed findings
    sections.push('## 3. Detailed Findings', '');
    let findingNum = 1;
    for (const vuln of data.vulns) {
      sections.push(`### 3.${findingNum} ${vuln.title}`, '');
      sections.push(`- **Severity:** ${vuln.severity} (CVSS: ${vuln.cvss})`);
      if (vuln.cve) sections.push(`- **CVE:** ${vuln.cve}`);
      if (vuln.mitre_id) sections.push(`- **MITRE ATT&CK:** ${vuln.mitre_id}`);
      sections.push(`- **Status:** ${vuln.status}`);
      sections.push('', vuln.description, '');
      if (vuln.poc_output) {
        sections.push('**Proof of Concept:**', '```', vuln.poc_output, '```', '');
      }
      findingNum++;
    }

    // Remediation
    sections.push('## 4. Remediation Recommendations', '');
    for (const vuln of data.vulns) {
      if (vuln.severity === 'critical' || vuln.severity === 'high') {
        sections.push(`- **${vuln.title}**: Immediate remediation required`);
      }
    }

    // Evidence appendix
    sections.push('', '## 5. Evidence Appendix', '');
    sections.push(`- ${data.hosts.length} hosts discovered`);
    sections.push(`- ${data.credentials.length} credentials identified`);
    sections.push(`- ${data.chains.length} attack chains mapped`);
    sections.push(`- ${data.sessionLog.length} actions logged`);

    return sections.join('\n');
  }

  private renderExecutive(sections: string[], data: ReportData): string {
    const bySeverity = this.groupBySeverity(data.vulns);
    const criticalHigh = (bySeverity.critical || 0) + (bySeverity.high || 0);

    sections.push('## Overview', '');
    sections.push(`During the penetration test of ${data.engagement.client}, ${data.vulns.length} vulnerabilities were identified across ${data.hosts.length} hosts.`);
    sections.push('');

    sections.push('## Risk Summary', '');
    sections.push(`- **Critical/High Risk Findings:** ${criticalHigh}`);
    sections.push(`- **Medium Risk Findings:** ${bySeverity.medium || 0}`);
    sections.push(`- **Low/Info Findings:** ${(bySeverity.low || 0) + (bySeverity.info || 0)}`);
    sections.push('');

    sections.push('## Key Recommendations', '');
    const criticalVulns = data.vulns.filter((v) => v.severity === 'critical' || v.severity === 'high');
    for (const v of criticalVulns.slice(0, 5)) {
      sections.push(`1. Remediate "${v.title}" (${v.severity})`);
    }

    return sections.join('\n');
  }

  private renderHandoff(sections: string[], data: ReportData): string {
    sections.push('## Session Summary', '');
    sections.push(`- Hosts: ${data.hosts.length}`);
    sections.push(`- Vulnerabilities: ${data.vulns.length}`);
    sections.push(`- Credentials: ${data.credentials.length}`);
    sections.push(`- Attack Chains: ${data.chains.length}`);
    sections.push('');

    sections.push('## Recent Actions', '');
    for (const log of data.sessionLog.slice(0, 20)) {
      sections.push(`- [${log.created_at}] ${log.agent}: ${log.summary}`);
    }

    sections.push('', '## Next Steps', '');
    sections.push('1. Review unconfirmed findings');
    sections.push('2. Continue exploitation phase');
    sections.push('3. Validate attack chains');

    return sections.join('\n');
  }

  exportJSON(data: ReportData): string {
    return JSON.stringify(data, null, 2);
  }

  saveReport(engagementId: string, content: string, type: ReportType): string {
    const reportsDir = path.resolve(process.cwd(), 'data', 'reports', engagementId);
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filePath = path.join(reportsDir, `${type}_${timestamp}.md`);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  private groupBySeverity(vulns: Vuln[]): Record<string, number> {
    const result: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const v of vulns) {
      result[v.severity] = (result[v.severity] || 0) + 1;
    }
    return result;
  }
}

export default ReportService;
