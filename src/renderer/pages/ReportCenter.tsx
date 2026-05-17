import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Select, Button, Space, Card, Divider, Tag, Row, Col, message } from 'antd';
import { FileTextOutlined, DownloadOutlined, CopyOutlined } from '@ant-design/icons';
import { useAppStore } from '../stores/appStore';
import { useFindingsStore } from '../stores/findingsStore';
import { useEngagementStore } from '../stores/engagementStore';

const ReportCenter = () => {
  const { t } = useTranslation();
  const { activeEngagement } = useAppStore();
  const { vulns, hosts, credentials, chains } = useFindingsStore();
  const { engagements } = useEngagementStore();
  const [reportType, setReportType] = useState<string>('technical');
  const [preview, setPreview] = useState<string>('');

  const generateReport = () => {
    if (!activeEngagement) {
      message.warning('Select an engagement first');
      return;
    }

    const now = new Date().toLocaleString();
    let md = '';

    if (reportType === 'technical') {
      const critCount = vulns.filter(v => v.severity === 'critical').length;
      const highCount = vulns.filter(v => v.severity === 'high').length;
      const medCount = vulns.filter(v => v.severity === 'medium').length;
      const lowCount = vulns.filter(v => v.severity === 'low').length;

      md = `# Technical Penetration Test Report
## ${activeEngagement.client}
**Engagement Type:** ${activeEngagement.type.toUpperCase()}
**Period:** ${activeEngagement.start_date} — ${activeEngagement.end_date}
**Generated:** ${now}

---

## Executive Summary

A ${activeEngagement.type} penetration test was conducted against ${activeEngagement.client} from ${activeEngagement.start_date} to ${activeEngagement.end_date}.
The assessment identified **${vulns.length}** vulnerabilities, including **${critCount}** critical and **${highCount}** high severity issues.

**Scope:** ${activeEngagement.scope}
**Rules of Engagement:** ${activeEngagement.roe || 'Standard'}

---

## Findings Summary

| Severity | Count |
|----------|-------|
| Critical | ${critCount} |
| High     | ${highCount} |
| Medium   | ${medCount} |
| Low      | ${lowCount} |
| **Total** | **${vulns.length}** |

---

## Detailed Findings

${vulns.map((v, i) => `### ${i + 1}. ${v.title}
- **Severity:** ${v.severity.toUpperCase()} (CVSS: ${v.cvss})
- **CVE:** ${v.cve || 'N/A'}
- **MITRE ATT&CK:** ${v.mitre_id || 'N/A'}
- **Host:** ${hosts.find(h => h.id === v.host_id)?.ip || 'Unknown'}
- **Status:** ${v.status}
- **Found by:** ${v.found_by} (${v.tool_used})

${v.description}

${v.poc_output ? `**Proof of Concept:**\n\`\`\`\n${v.poc_output}\n\`\`\`` : ''}
`).join('\n---\n\n')}

---

## Compromised Hosts

${hosts.filter(h => h.status === 'compromised').map(h => `- **${h.ip}** (${h.hostname}) — ${h.os}: ${h.notes}`).join('\n') || 'None'}

---

## Credentials Obtained

${credentials.map(c => `- **${c.username}** (${c.secret_type}) @ ${c.domain} — Access: ${c.access_level}`).join('\n') || 'None'}

---

## Attack Chains

${chains.map(ch => {
  let steps: any[] = [];
  try { steps = JSON.parse(ch.steps); } catch { steps = []; }
  return `### ${ch.name} (Score: ${ch.score})
${steps.map((s, i) => `${i + 1}. [${s.phase}] ${s.action} (${s.mitre})`).join('\n')}`;
}).join('\n\n') || 'No attack chains documented'}

---

## Recommendations

1. Patch critical vulnerabilities immediately (Exchange ProxyNotShell, Fortinet VPN RCE)
2. Enforce strong passwords on service accounts
3. Implement network segmentation between DMZ and internal
4. Enable MFA on all administrative accounts
5. Review and harden Exchange server configuration
`;
    } else if (reportType === 'executive') {
      md = `# Executive Summary Report
## ${activeEngagement.client}

**Assessment Period:** ${activeEngagement.start_date} — ${activeEngagement.end_date}
**Type:** ${activeEngagement.type.toUpperCase()} Penetration Test

---

## Key Findings

- **${vulns.length}** vulnerabilities identified
- **${hosts.filter(h => h.status === 'compromised').length}** hosts compromised
- **${credentials.length}** credentials obtained
- **${chains.length}** complete attack chains demonstrated

## Risk Rating

${(() => {
  const crits = vulns.filter(v => v.severity === 'critical').length;
  if (crits > 0) return '**HIGH RISK** — Critical vulnerabilities found that could lead to full system compromise.';
  const highs = vulns.filter(v => v.severity === 'high').length;
  if (highs > 0) return '**MEDIUM-HIGH RISK** — Significant vulnerabilities requiring prompt remediation.';
  return '**MODERATE RISK** — Standard hardening recommendations apply.';
})()}

## Top Recommendations

1. Immediate patching of critical CVEs
2. Service account password rotation
3. Network segmentation review
4. MFA enforcement expansion
5. Security monitoring enhancement
`;
    } else {
      md = `# Handoff Report
## ${activeEngagement.client}

**Date:** ${now}
**Status:** ${activeEngagement.status}

---

## Current State

- **Hosts discovered:** ${hosts.length}
- **Vulnerabilities:** ${vulns.length} (${vulns.filter(v => v.status === 'confirmed').length} confirmed, ${vulns.filter(v => v.status === 'unconfirmed').length} unconfirmed)
- **Credentials:** ${credentials.length}
- **Attack chains:** ${chains.length}

## Unconfirmed Findings

${vulns.filter(v => v.status === 'unconfirmed').map(v => `- ${v.title} (${v.severity}) — needs manual verification`).join('\n') || 'All findings confirmed'}

## Next Steps

1. Verify unconfirmed findings
2. Complete lateral movement testing
3. Finalize report for client delivery
4. Archive evidence files
`;
    }

    setPreview(md);
    message.success('Report generated');
  };

  const handleExport = (format: string) => {
    if (!preview) {
      message.warning('Generate a report first');
      return;
    }
    let content: string;
    let mimeType: string;
    if (format === 'json') {
      const jsonData = {
        engagement: { client: activeEngagement?.client, type: activeEngagement?.type, scope: activeEngagement?.scope },
        report_type: reportType,
        generated_at: new Date().toISOString(),
        summary: { hosts: hosts.length, vulns: vulns.length, credentials: credentials.length, chains: chains.length },
        vulns: vulns.map(v => ({ title: v.title, severity: v.severity, cvss: v.cvss, cve: v.cve, status: v.status, mitre_id: v.mitre_id })),
        hosts: hosts.map(h => ({ ip: h.ip, hostname: h.hostname, os: h.os, status: h.status })),
        credentials: credentials.map(c => ({ username: c.username, domain: c.domain, access_level: c.access_level, source: c.source })),
        chains: chains.map(ch => { let steps = []; try { steps = JSON.parse(ch.steps); } catch {} return { name: ch.name, score: ch.score, status: ch.status, steps }; }),
        report_markdown: preview,
      };
      content = JSON.stringify(jsonData, null, 2);
      mimeType = 'application/json';
    } else {
      content = preview;
      mimeType = 'text/markdown';
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeEngagement?.client || 'report'}_${reportType}_${new Date().toISOString().slice(0, 10)}.${format === 'json' ? 'json' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`Exported as ${format.toUpperCase()}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(preview);
    message.success('Copied to clipboard');
  };

  return (
    <div>
      <Typography.Title level={3}>{t('reports.title')}</Typography.Title>

      {!activeEngagement && (
        <Typography.Text type="secondary">Select an engagement from the Dashboard first.</Typography.Text>
      )}

      <Row gutter={16}>
        <Col span={8}>
          <Card title="Report Configuration" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Typography.Text strong>Engagement</Typography.Text>
                <div style={{ marginTop: 4 }}>
                  {activeEngagement ? (
                    <Tag color="green">{activeEngagement.client}</Tag>
                  ) : (
                    <Tag color="default">None selected</Tag>
                  )}
                </div>
              </div>
              <div>
                <Typography.Text strong>Report Type</Typography.Text>
                <Select
                  value={reportType}
                  onChange={setReportType}
                  style={{ width: '100%', marginTop: 4 }}
                  options={[
                    { value: 'technical', label: t('reports.type.technical') },
                    { value: 'executive', label: t('reports.type.executive') },
                    { value: 'handoff', label: t('reports.type.handoff') },
                  ]}
                />
              </div>
              <div>
                <Typography.Text strong>Data Summary</Typography.Text>
                <div style={{ marginTop: 4 }}>
                  <Space wrap>
                    <Tag>{hosts.length} hosts</Tag>
                    <Tag>{vulns.length} vulns</Tag>
                    <Tag>{credentials.length} creds</Tag>
                    <Tag>{chains.length} chains</Tag>
                  </Space>
                </div>
              </div>
              <Button type="primary" icon={<FileTextOutlined />} onClick={generateReport} block>
                {t('reports.generate')}
              </Button>
            </Space>
          </Card>

          <Card title="Export" size="small" style={{ marginTop: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button icon={<DownloadOutlined />} onClick={() => handleExport('md')} block disabled={!preview}>
                {t('reports.export.md')}
              </Button>
              <Button icon={<DownloadOutlined />} onClick={() => handleExport('json')} block disabled={!preview}>
                {t('reports.export.json')}
              </Button>
              <Button icon={<CopyOutlined />} onClick={handleCopy} block disabled={!preview}>
                Copy to Clipboard
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={16}>
          <Card
            title="Report Preview"
            size="small"
            extra={preview ? <Typography.Text type="secondary">{preview.split('\n').length} lines</Typography.Text> : null}
          >
            {preview ? (
              <div style={{
                background: '#0d1117', padding: 24, borderRadius: 8, minHeight: 500,
                fontFamily: 'monospace', fontSize: 12, color: '#c9d1d9', whiteSpace: 'pre-wrap',
                maxHeight: 700, overflow: 'auto',
              }}>
                {preview}
              </div>
            ) : (
              <div style={{ background: '#fafafa', padding: 48, borderRadius: 8, minHeight: 500, textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
                <div style={{ marginTop: 16 }}>
                  <Typography.Text type="secondary">Click "Generate" to create a report preview</Typography.Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportCenter;
