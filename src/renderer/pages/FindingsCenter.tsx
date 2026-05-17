import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tabs, Table, Tag, Button, Space, Drawer, Descriptions, Input, Select, Modal, Card, message } from 'antd';
import { EyeOutlined, CheckOutlined, WarningOutlined } from '@ant-design/icons';
import { useFindingsStore } from '../stores/findingsStore';
import { useAppStore } from '../stores/appStore';
import { SEVERITY_COLORS } from '../../shared/constants';

const FindingsCenter = () => {
  const { t } = useTranslation();
  const { hosts, services, vulns, credentials, chains, loadFindings, bulkUpdateVulnStatus } = useFindingsStore();
  const { activeEngagement } = useAppStore();
  const [selectedVuln, setSelectedVuln] = useState<any>(null);
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [selectedChain, setSelectedChain] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  useEffect(() => {
    if (activeEngagement) loadFindings(activeEngagement.id);
  }, [activeEngagement]);

  const handleBulkUpdate = () => {
    if (selectedRowKeys.length > 0 && bulkStatus) {
      bulkUpdateVulnStatus(selectedRowKeys, bulkStatus);
      message.success(`Updated ${selectedRowKeys.length} vulns to ${bulkStatus}`);
      setSelectedRowKeys([]);
      setBulkStatus('');
    }
  };

  const statusColors: Record<string, string> = {
    unconfirmed: 'default', confirmed: 'cyan', exploited: 'red', fixed: 'green', accepted: 'orange',
  };

  // --- Hosts Tab ---
  const hostColumns = [
    { title: 'IP', dataIndex: 'ip', key: 'ip', render: (v: string, r: any) => <a onClick={() => setSelectedHost(r)} style={{ color: '#00f0ff' }}>{v}</a> },
    { title: 'Hostname', dataIndex: 'hostname', key: 'hostname' },
    { title: 'OS', dataIndex: 'os', key: 'os', ellipsis: true },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (v: string) => <Tag color="geekblue">{v}</Tag> },
    {
      title: t('common.status'), dataIndex: 'status', key: 'status',
      render: (v: string) => {
        const color = v === 'compromised' ? 'red' : v === 'vulnerable' ? 'orange' : v === 'scanned' ? 'cyan' : 'default';
        return <Tag color={color}>{v}</Tag>;
      },
    },
    { title: 'Found By', dataIndex: 'discovered_by', key: 'discovered_by', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: t('common.actions'), key: 'actions',
      render: (_: any, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedHost(r)}>Detail</Button>,
    },
  ];

  // --- Services Tab ---
  const serviceColumns = [
    { title: 'Host ID', dataIndex: 'host_id', key: 'host_id' },
    { title: 'Port', dataIndex: 'port', key: 'port', sorter: (a: any, b: any) => a.port - b.port,
      render: (v: number) => <code style={{ color: '#00f0ff' }}>{v}</code> },
    { title: 'Protocol', dataIndex: 'protocol', key: 'protocol', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Service', dataIndex: 'service', key: 'service', render: (v: string) => <Tag color="cyan">{v}</Tag> },
    { title: 'Version', dataIndex: 'version', key: 'version', ellipsis: true },
    {
      title: 'State', dataIndex: 'state', key: 'state',
      render: (v: string) => <Tag color={v === 'open' ? 'green' : 'default'}>{v}</Tag>,
    },
  ];

  // --- Vulns Tab ---
  const vulnColumns = [
    {
      title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true,
      render: (v: string, r: any) => <a onClick={() => setSelectedVuln(r)} style={{ color: '#00f0ff' }}>{v}</a>,
    },
    {
      title: 'Severity', dataIndex: 'severity', key: 'severity',
      render: (v: string) => <Tag color={SEVERITY_COLORS[v]}>{v.toUpperCase()}</Tag>,
      sorter: (a: any, b: any) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return (order[a.severity as keyof typeof order] ?? 5) - (order[b.severity as keyof typeof order] ?? 5);
      },
    },
    { title: 'CVSS', dataIndex: 'cvss', key: 'cvss', sorter: (a: any, b: any) => a.cvss - b.cvss,
      render: (v: number) => <span style={{ color: v >= 9 ? '#ff073a' : v >= 7 ? '#ff6b00' : '#ffe600' }}>{v}</span> },
    { title: 'CVE', dataIndex: 'cve', key: 'cve', render: (v: string) => v ? <code style={{ color: '#bf00ff' }}>{v}</code> : '-' },
    {
      title: t('common.status'), dataIndex: 'status', key: 'status',
      render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>,
    },
    { title: 'Tool', dataIndex: 'tool_used', key: 'tool_used', render: (v: string) => <Tag color="geekblue">{v}</Tag> },
    {
      title: 'MITRE', dataIndex: 'mitre_id', key: 'mitre_id',
      render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-',
    },
    {
      title: t('common.actions'), key: 'actions',
      render: (_: any, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedVuln(r)}>Detail</Button>,
    },
  ];

  // --- Credentials Tab ---
  const credColumns = [
    { title: 'Username', dataIndex: 'username', key: 'username',
      render: (v: string) => <span style={{ color: '#00f0ff' }}>{v}</span> },
    {
      title: 'Type', dataIndex: 'secret_type', key: 'secret_type',
      render: (v: string) => <Tag color={v === 'hash' ? 'orange' : 'cyan'}>{v}</Tag>,
    },
    { title: 'Domain', dataIndex: 'domain', key: 'domain' },
    {
      title: 'Access', dataIndex: 'access_level', key: 'access_level',
      render: (v: string) => <Tag color={v === 'domain-admin' ? 'red' : v === 'admin' ? 'orange' : 'default'}>{v}</Tag>,
    },
    {
      title: 'Valid', dataIndex: 'valid', key: 'valid',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    { title: 'Source', dataIndex: 'source', key: 'source', render: (v: string) => <Tag>{v}</Tag> },
  ];

  // --- Chains Tab ---
  const chainColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v: string, r: any) => <a onClick={() => setSelectedChain(r)} style={{ color: '#00f0ff' }}>{v}</a> },
    {
      title: 'Score', dataIndex: 'score', key: 'score',
      render: (v: number) => <Tag color={v >= 8 ? 'red' : v >= 5 ? 'orange' : 'green'}>{v}</Tag>,
      sorter: (a: any, b: any) => a.score - b.score,
    },
    {
      title: t('common.status'), dataIndex: 'status', key: 'status',
      render: (v: string) => <Tag color={v === 'complete' ? 'green' : 'processing'}>{v}</Tag>,
    },
    { title: 'MITRE IDs', dataIndex: 'mitre_ids', key: 'mitre_ids', ellipsis: true },
    {
      title: t('common.actions'), key: 'actions',
      render: (_: any, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedChain(r)}>Detail</Button>,
    },
  ];

  const tabItems = [
    {
      key: 'hosts',
      label: <span>{t('findings.hosts')} <Tag color="cyan">{hosts.length}</Tag></span>,
      children: <Table columns={hostColumns} dataSource={hosts} rowKey="id" size="small" pagination={{ pageSize: 10 }} />,
    },
    {
      key: 'services',
      label: <span>Services <Tag color="cyan">{services.length}</Tag></span>,
      children: <Table columns={serviceColumns} dataSource={services} rowKey="id" size="small" pagination={{ pageSize: 10 }} />,
    },
    {
      key: 'vulns',
      label: (
        <span>
          {t('findings.vulns')} <Tag color="orange">{vulns.length}</Tag>
          {vulns.filter(v => v.severity === 'critical').length > 0 && (
            <Tag color="red" icon={<WarningOutlined />}>{vulns.filter(v => v.severity === 'critical').length} critical</Tag>
          )}
        </span>
      ),
      children: (
        <div>
          {selectedRowKeys.length > 0 && (
            <Space style={{ marginBottom: 12 }}>
              <Tag color="magenta">{selectedRowKeys.length} selected</Tag>
              <Select
                size="small" placeholder="Bulk status" style={{ width: 140 }}
                value={bulkStatus || undefined}
                onChange={v => setBulkStatus(v)}
                options={[
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'fixed', label: 'Fixed' },
                  { value: 'accepted', label: 'Accepted' },
                ]}
              />
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleBulkUpdate}>Apply</Button>
            </Space>
          )}
          <Table
            columns={vulnColumns}
            dataSource={vulns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys as number[]) }}
          />
        </div>
      ),
    },
    {
      key: 'creds',
      label: <span>{t('findings.creds')} <Tag color="cyan">{credentials.length}</Tag></span>,
      children: <Table columns={credColumns} dataSource={credentials} rowKey="id" size="small" pagination={{ pageSize: 10 }} />,
    },
    {
      key: 'chains',
      label: <span>{t('findings.chains')} <Tag color="cyan">{chains.length}</Tag></span>,
      children: <Table columns={chainColumns} dataSource={chains} rowKey="id" size="small" pagination={{ pageSize: 10 }} />,
    },
  ];

  return (
    <div>
      <Typography.Title level={3} className="neon-title">{t('findings.title')}</Typography.Title>

      {!activeEngagement && (
        <Typography.Text type="secondary">Select an engagement from the Dashboard to view findings.</Typography.Text>
      )}

      <Tabs items={tabItems} />

      {/* Vuln Detail Drawer */}
      <Drawer
        title={<span style={{ color: '#ff073a' }}>Vulnerability Detail</span>}
        open={!!selectedVuln}
        onClose={() => setSelectedVuln(null)}
        width={600}
      >
        {selectedVuln && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Title">{selectedVuln.title}</Descriptions.Item>
              <Descriptions.Item label="Severity">
                <Tag color={SEVERITY_COLORS[selectedVuln.severity]}>{selectedVuln.severity?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="CVSS"><span style={{ color: '#ff6b00' }}>{selectedVuln.cvss}</span></Descriptions.Item>
              <Descriptions.Item label="CVE">{selectedVuln.cve || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedVuln.status]}>{selectedVuln.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="MITRE ATT&CK">{selectedVuln.mitre_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="Found By">{selectedVuln.found_by}</Descriptions.Item>
              <Descriptions.Item label="Confirmed By">{selectedVuln.confirmed_by || '-'}</Descriptions.Item>
              <Descriptions.Item label="Tool">{selectedVuln.tool_used}</Descriptions.Item>
              <Descriptions.Item label="Evidence File">{selectedVuln.evidence_file}</Descriptions.Item>
            </Descriptions>
            <Typography.Title level={5} style={{ marginTop: 16, color: '#00f0ff' }}>Description</Typography.Title>
            <Typography.Paragraph>{selectedVuln.description}</Typography.Paragraph>
            {selectedVuln.poc_output && (
              <>
                <Typography.Title level={5} style={{ color: '#39ff14' }}>PoC Output</Typography.Title>
                <Card size="small" className="terminal-block">
                  {selectedVuln.poc_output}
                </Card>
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* Host Detail Drawer */}
      <Drawer
        title={<span style={{ color: '#00f0ff' }}>Host Detail</span>}
        open={!!selectedHost}
        onClose={() => setSelectedHost(null)}
        width={500}
      >
        {selectedHost && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="IP"><code style={{ color: '#00f0ff' }}>{selectedHost.ip}</code></Descriptions.Item>
            <Descriptions.Item label="Hostname">{selectedHost.hostname}</Descriptions.Item>
            <Descriptions.Item label="OS">{selectedHost.os}</Descriptions.Item>
            <Descriptions.Item label="Role">{selectedHost.role}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedHost.status === 'compromised' ? 'red' : 'cyan'}>{selectedHost.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Discovered By">{selectedHost.discovered_by}</Descriptions.Item>
            <Descriptions.Item label="Notes">{selectedHost.notes}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* Chain Detail Drawer */}
      <Drawer
        title={<span style={{ color: '#bf00ff' }}>Attack Chain Detail</span>}
        open={!!selectedChain}
        onClose={() => setSelectedChain(null)}
        width={600}
      >
        {selectedChain && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Name">{selectedChain.name}</Descriptions.Item>
              <Descriptions.Item label="Score">
                <Tag color={selectedChain.score >= 8 ? 'red' : 'orange'}>{selectedChain.score}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">{selectedChain.status}</Descriptions.Item>
              <Descriptions.Item label="MITRE IDs">{selectedChain.mitre_ids}</Descriptions.Item>
            </Descriptions>
            <Typography.Title level={5} style={{ marginTop: 16, color: '#bf00ff' }}>Attack Steps</Typography.Title>
            {(() => {
              let steps: any[] = [];
              try { steps = JSON.parse(selectedChain.steps); } catch { steps = []; }
              return steps.map((step, i) => (
                <div key={i} style={{ marginBottom: 8, padding: 8, background: '#0f0f1e', borderRadius: 4, borderLeft: '3px solid #bf00ff' }}>
                  <Space>
                    <Tag color="cyan">{step.phase}</Tag>
                    <Tag color="purple">{step.mitre}</Tag>
                  </Space>
                  <div style={{ marginTop: 4, color: '#e8e8f0' }}>{step.action}</div>
                </div>
              ));
            })()}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default FindingsCenter;
