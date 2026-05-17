import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Table, Tag, Select, Drawer, Descriptions, Button, Space, Card, Divider, List } from 'antd';
import { EyeOutlined, ToolOutlined } from '@ant-design/icons';
import { useAgentStore } from '../stores/agentStore';

const AgentConsole = () => {
  const { t } = useTranslation();
  const { agents, domains, filterDomain, selectedAgent, loadAgents, selectAgent, setFilterDomain, getFilteredAgents } = useAgentStore();

  useEffect(() => { loadAgents(); }, []);

  const filtered = getFilteredAgents();

  const columns = [
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (v: string, r: any) => <a onClick={() => selectAgent(r)}>{v}</a>,
    },
    {
      title: 'Domain', dataIndex: 'domain', key: 'domain',
      render: (d: string) => <Tag color="cyan">{d}</Tag>,
      filters: domains.map(d => ({ text: d, value: d })),
      onFilter: (value: any, record: any) => record.domain === value,
    },
    {
      title: 'Tier', dataIndex: 'tier', key: 'tier',
      render: (tier: number) => (
        <Tag color={tier === 2 ? 'orange' : 'blue'}>
          {tier === 2 ? t('agents.tier2') : t('agents.tier1')}
        </Tag>
      ),
      filters: [
        { text: t('agents.tier1'), value: 1 },
        { text: t('agents.tier2'), value: 2 },
      ],
      onFilter: (value: any, record: any) => record.tier === value,
    },
    {
      title: 'Model', dataIndex: 'model', key: 'model',
      render: (m: string) => <Typography.Text code style={{ fontSize: 11 }}>{m.replace('claude-', '').replace('-20250514', '')}</Typography.Text>,
    },
    {
      title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true,
    },
    {
      title: t('common.actions'), key: 'actions',
      render: (_: any, r: any) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => selectAgent(r)}>Detail</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{t('agents.title')}</Typography.Title>
        <Space>
          <Select
            placeholder={t('agents.filter')}
            style={{ width: 200 }}
            allowClear
            value={filterDomain || undefined}
            onChange={(v) => setFilterDomain(v || '')}
            options={[...domains.map(d => ({ value: d, label: d }))]}
          />
          <Typography.Text type="secondary">{filtered.length} agents</Typography.Text>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="name"
        size="middle"
        pagination={{ pageSize: 15 }}
      />

      {/* Agent Detail Drawer */}
      <Drawer
        title={selectedAgent?.name || 'Agent Detail'}
        open={!!selectedAgent}
        onClose={() => selectAgent(null)}
        width={560}
      >
        {selectedAgent && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Name">{selectedAgent.name}</Descriptions.Item>
              <Descriptions.Item label="Tier">
                <Tag color={selectedAgent.tier === 2 ? 'orange' : 'blue'}>
                  {selectedAgent.tier === 2 ? 'Tier 2 - Execution' : 'Tier 1 - Advisory'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Domain"><Tag color="cyan">{selectedAgent.domain}</Tag></Descriptions.Item>
              <Descriptions.Item label="Model"><code>{selectedAgent.model}</code></Descriptions.Item>
              <Descriptions.Item label="Description">{selectedAgent.description}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left"><ToolOutlined /> Tools</Divider>
            <Space wrap>
              {selectedAgent.tools.map(tool => (
                <Tag key={tool} color="geekblue">{tool}</Tag>
              ))}
            </Space>

            <Divider orientation="left">Prompt Preview</Divider>
            <Card size="small" style={{ background: '#0d1117' }}>
              <Typography.Paragraph style={{ fontFamily: 'monospace', fontSize: 12, color: '#c9d1d9', whiteSpace: 'pre-wrap', margin: 0 }}>
                {`Agent: ${selectedAgent.name}\nTier: ${selectedAgent.tier}\nDomain: ${selectedAgent.domain}\n\nYou are a ${selectedAgent.domain} specialist.\n\nCore responsibilities:\n${selectedAgent.description}\n\nTools available: ${selectedAgent.tools.join(', ')}\n\n${selectedAgent.tier === 2 ? 'SCOPE REQUIRED: All target validation required before execution.' : 'Advisory mode: Analysis and recommendations only.'}`}
              </Typography.Paragraph>
            </Card>

            <Divider />
            <Space>
              <Button type="primary" onClick={() => selectAgent(null)}>Close</Button>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AgentConsole;
