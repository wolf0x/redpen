import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tabs, Card, Form, Input, Radio, Table, Tag, Button, Switch, Space, Divider, message } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { useAgentStore } from '../stores/agentStore';
import { HARD_REFUSAL_PATTERNS, TIER_2_AGENTS } from '../../shared/constants';

const mockTools = [
  { tool: 'nmap', installed: true, version: '7.94', path: '/usr/bin/nmap' },
  { tool: 'nuclei', installed: true, version: '3.2.4', path: '/usr/local/bin/nuclei' },
  { tool: 'sqlmap', installed: true, version: '1.8.3', path: '/usr/bin/sqlmap' },
  { tool: 'ffuf', installed: true, version: '2.1.0', path: '/usr/local/bin/ffuf' },
  { tool: 'gobuster', installed: true, version: '3.6.0', path: '/usr/local/bin/gobuster' },
  { tool: 'bloodhound', installed: true, version: '4.3.1', path: '/usr/bin/bloodhound' },
  { tool: 'impacket', installed: true, version: '0.12.0', path: '/usr/local/bin/impacket' },
  { tool: 'crackmapexec', installed: false, version: '-', path: '' },
  { tool: 'hydra', installed: true, version: '9.5', path: '/usr/bin/hydra' },
  { tool: 'hashcat', installed: true, version: '6.2.6', path: '/usr/bin/hashcat' },
  { tool: 'metasploit', installed: false, version: '-', path: '' },
  { tool: 'shodan', installed: true, version: '1.31.0', path: '/usr/local/bin/shodan' },
  { tool: 'nikto', installed: true, version: '2.5.0', path: '/usr/bin/nikto' },
  { tool: 'dalfox', installed: true, version: '2.9.1', path: '/usr/local/bin/dalfox' },
  { tool: 'john', installed: true, version: '1.9.0', path: '/usr/bin/john' },
];

const ConfigCenter = () => {
  const { t } = useTranslation();
  const { agents } = useAgentStore();
  const [approvalStrategy, setApprovalStrategy] = useState('all');
  const [scopeEnforcement, setScopeEnforcement] = useState(true);
  const [autoAudit, setAutoAudit] = useState(true);
  const [evidencePath, setEvidencePath] = useState('data/evidence');
  const [dbPath, setDbPath] = useState('data/redpen.db');
  const [localModelEndpoint, setLocalModelEndpoint] = useState('');
  const [toolScanDone, setToolScanDone] = useState(true);

  const handleSave = () => {
    message.success('Configuration saved');
  };

  const handleToolScan = () => {
    setToolScanDone(false);
    setTimeout(() => {
      setToolScanDone(true);
      message.success('Tool health check complete');
    }, 1500);
  };

  const policyTab = (
    <Card>
      <Form layout="vertical">
        <Form.Item label="Approval Strategy">
          <Radio.Group value={approvalStrategy} onChange={e => setApprovalStrategy(e.target.value)}>
            <Radio.Button value="all">All Approval</Radio.Button>
            <Radio.Button value="high">High Risk Only</Radio.Button>
            <Radio.Button value="auto">Auto-Approve Safe</Radio.Button>
          </Radio.Group>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            {approvalStrategy === 'all' && 'Every Tier 2 command requires manual approval before execution.'}
            {approvalStrategy === 'high' && 'Only LOUD noise-level commands require approval. Moderate/quiet auto-approve.'}
            {approvalStrategy === 'auto' && 'Commands matching safe patterns auto-approve. Hard refusals still enforced.'}
          </Typography.Paragraph>
        </Form.Item>

        <Divider />

        <Form.Item label="Scope Enforcement">
          <Space>
            <Switch checked={scopeEnforcement} onChange={setScopeEnforcement} />
            <Typography.Text>{scopeEnforcement ? 'Active — out-of-scope targets will be blocked' : 'Disabled — no scope validation'}</Typography.Text>
          </Space>
        </Form.Item>

        <Form.Item label="Auto-Audit Logging">
          <Space>
            <Switch checked={autoAudit} onChange={setAutoAudit} />
            <Typography.Text>{autoAudit ? 'Enabled — all commands logged to session_log' : 'Disabled'}</Typography.Text>
          </Space>
        </Form.Item>

        <Divider />

        <Form.Item label={<span style={{ color: '#ff073a' }}>Hard Refusal Rules (read-only)</span>}>
          <div className="terminal-block" style={{ padding: 12 }}>
            {HARD_REFUSAL_PATTERNS.map((p, i) => (
              <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>
                <Tag color="red">{i + 1}</Tag> <span style={{ color: '#ff073a' }}>{p.toString()}</span>
              </div>
            ))}
          </div>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            These patterns are enforced by the scope-gate plugin. Commands matching any pattern are hard-rejected regardless of approval status.
          </Typography.Paragraph>
        </Form.Item>

        <Form.Item label={<span style={{ color: '#ff6b00' }}>Tier 2 Agents (require approval)</span>}>
          <Space wrap>
            {TIER_2_AGENTS.map(a => <Tag key={a} color="orange">{a}</Tag>)}
          </Space>
        </Form.Item>

        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>Save Policy</Button>
      </Form>
    </Card>
  );

  const toolColumns = [
    {
      title: 'Tool', dataIndex: 'tool', key: 'tool',
      render: (v: string) => <Typography.Text strong style={{ color: '#e8e8f0' }}>{v}</Typography.Text>,
    },
    {
      title: 'Status', dataIndex: 'installed', key: 'installed',
      render: (v: boolean) => v
        ? <Tag icon={<CheckCircleOutlined />} color="green">Installed</Tag>
        : <Tag icon={<CloseCircleOutlined />} color="red">Missing</Tag>,
    },
    { title: 'Version', dataIndex: 'version', key: 'version', render: (v: string) => <code style={{ color: '#bf00ff' }}>{v}</code> },
    { title: 'Path', dataIndex: 'path', key: 'path', render: (v: string) => v ? <code style={{ color: '#8888aa', fontSize: 11 }}>{v}</code> : '-' },
  ];

  const toolsTab = (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={handleToolScan} loading={!toolScanDone}>
          Run Health Check
        </Button>
        <Tag color="cyan">{mockTools.filter(t => t.installed).length}/{mockTools.length} tools installed</Tag>
      </Space>
      <Table
        columns={toolColumns}
        dataSource={mockTools}
        rowKey="tool"
        size="small"
        pagination={false}
        rowClassName={(r: any) => r.installed ? '' : 'ant-table-row-warning'}
      />
    </div>
  );

  const modelColumns = [
    { title: 'Agent', dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ color: '#00f0ff' }}>{v}</span> },
    { title: 'Domain', dataIndex: 'domain', key: 'domain', render: (v: string) => <Tag color="cyan">{v}</Tag> },
    {
      title: 'Tier', dataIndex: 'tier', key: 'tier',
      render: (t: number) => <Tag color={t === 2 ? 'orange' : 'magenta'}>Tier {t}</Tag>,
    },
    {
      title: 'Model', dataIndex: 'model', key: 'model',
      render: (m: string) => <code style={{ fontSize: 11, color: '#bf00ff' }}>{m.replace('claude-', '').replace('-20250514', '')}</code>,
    },
    {
      title: 'Est. Cost/Run', key: 'cost',
      render: (_: any, r: any) => {
        const base = r.tier === 2 ? '$0.08' : '$0.04';
        return <Typography.Text style={{ color: '#39ff14' }}>{base}</Typography.Text>;
      },
    },
  ];

  const modelsTab = (
    <Table
      columns={modelColumns}
      dataSource={agents}
      rowKey="name"
      size="small"
      pagination={{ pageSize: 15 }}
      locale={{ emptyText: 'No agents loaded' }}
    />
  );

  const envTab = (
    <Card>
      <Form layout="vertical">
        <Form.Item label="Evidence Storage Path">
          <Input value={evidencePath} onChange={e => setEvidencePath(e.target.value)} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>Where command output and evidence files are stored</Typography.Text>
        </Form.Item>
        <Form.Item label="Database Path">
          <Input value={dbPath} onChange={e => setDbPath(e.target.value)} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>SQLite database file path</Typography.Text>
        </Form.Item>
        <Form.Item label="Local Model Endpoint">
          <Input
            value={localModelEndpoint}
            onChange={e => setLocalModelEndpoint(e.target.value)}
            placeholder="http://localhost:11434"
          />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>Optional Ollama/LocalAI endpoint for local model inference</Typography.Text>
        </Form.Item>

        <Divider />

        <Form.Item label="Data Directory">
          <div className="terminal-block" style={{ padding: 12 }}>
            <Space direction="vertical">
              <span>data/evidence/</span>
              <span>data/handoffs/</span>
              <span>data/agent-versions/</span>
              <span>data/redpen.db</span>
            </Space>
          </div>
        </Form.Item>

        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>Save Configuration</Button>
      </Form>
    </Card>
  );

  const tabItems = [
    { key: 'policy', label: t('config.policy'), children: policyTab },
    { key: 'tools', label: t('config.tools'), children: toolsTab },
    { key: 'models', label: t('config.models'), children: modelsTab },
    { key: 'env', label: t('config.environment'), children: envTab },
  ];

  return (
    <div>
      <Typography.Title level={3} className="neon-title">{t('config.title')}</Typography.Title>
      <Tabs items={tabItems} />
    </div>
  );
};

export default ConfigCenter;
