import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tabs, Table, Tag, Button, Space, Modal, Input, Card, Select, Alert, Timeline, Empty, Divider, Form, message } from 'antd';
import { CheckOutlined, CloseOutlined, PlayCircleOutlined, StopOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useFindingsStore } from '../stores/findingsStore';
import { useEngagementStore } from '../stores/engagementStore';
import { useAppStore } from '../stores/appStore';

const ExecutionCenter = () => {
  const { t } = useTranslation();
  const { approvals, sessionLog, loadApprovals, loadSessionLog, approveCommand, denyCommand } = useFindingsStore();
  const { engagements, loadEngagements } = useEngagementStore();
  const { activeEngagement } = useAppStore();
  const [denyModal, setDenyModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [denyReason, setDenyReason] = useState('');
  const [taskModal, setTaskModal] = useState(false);
  const [execLog, setExecLog] = useState<string[]>([]);

  useEffect(() => {
    loadEngagements();
    if (activeEngagement) {
      loadApprovals(activeEngagement.id);
      loadSessionLog(activeEngagement.id);
    }
  }, [activeEngagement]);

  const handleApprove = (id: number) => {
    approveCommand(id);
    message.success('Command approved and queued for execution');
  };

  const handleDeny = () => {
    if (denyModal.id) {
      denyCommand(denyModal.id);
      message.info('Command denied');
    }
    setDenyModal({ open: false, id: null });
    setDenyReason('');
  };

  const noiseColors: Record<string, string> = { QUIET: 'green', MODERATE: 'orange', LOUD: 'red' };
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const resolvedApprovals = approvals.filter(a => a.status !== 'pending');

  const approvalColumns = [
    { title: 'Command', dataIndex: 'command_text', key: 'command_text', ellipsis: true, width: 400 },
    { title: 'Agent', dataIndex: 'agent', key: 'agent', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'Noise', dataIndex: 'noise_level', key: 'noise_level',
      render: (n: string) => <Tag color={noiseColors[n]}>{t(`execution.noise.${n}`)}</Tag>,
    },
    { title: 'Time', dataIndex: 'created_at', key: 'created_at', render: (v: string) => new Date(v).toLocaleTimeString() },
    {
      title: t('common.actions'), key: 'actions',
      render: (_: any, r: any) => r.status === 'pending' ? (
        <Space>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(r.id)}>{t('execution.approve')}</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => setDenyModal({ open: true, id: r.id })}>{t('execution.deny')}</Button>
        </Space>
      ) : (
        <Tag color={r.status === 'approved' ? 'green' : r.status === 'denied' ? 'red' : 'default'}>{r.status}</Tag>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'realtime',
      label: (
        <span>
          <PlayCircleOutlined /> {t('execution.realTime')}
          {pendingApprovals.length > 0 && <Tag color="red" style={{ marginLeft: 8 }}>{pendingApprovals.length}</Tag>}
        </span>
      ),
      children: (
        <div>
          {!activeEngagement && (
            <Alert type="warning" message="No active engagement selected" description="Select an engagement from the Dashboard first." style={{ marginBottom: 16 }} />
          )}

          {/* Task Orchestrator */}
          <Card title="Task Orchestrator" size="small" style={{ marginBottom: 16 }}
            extra={<Button size="small" type="primary" onClick={() => setTaskModal(true)}>New Task</Button>}>
            <Typography.Text type="secondary">Select an agent, define a target, and compose a command to queue for approval.</Typography.Text>
          </Card>

          {/* Approval Queue */}
          <Typography.Title level={5}>
            <SafetyOutlined /> {t('execution.approvalQueue')}
            {pendingApprovals.length > 0 && <Tag color="red" style={{ marginLeft: 8 }}>{pendingApprovals.length} pending</Tag>}
          </Typography.Title>
          <Table
            columns={approvalColumns}
            dataSource={approvals}
            rowKey="id"
            size="small"
            pagination={false}
            locale={{ emptyText: 'No approval requests' }}
            rowClassName={(r: any) => r.status === 'pending' ? '' : 'ant-table-row-opacity'}
          />

          {/* Execution Stream */}
          <Divider />
          <Typography.Title level={5}>Execution Stream</Typography.Title>
          <Card size="small" style={{ background: '#0d1117', minHeight: 200, fontFamily: 'monospace', fontSize: 12, color: '#c9d1d9' }}>
            {execLog.length > 0 ? execLog.map((line, i) => (
              <div key={i}>{line}</div>
            )) : (
              <div style={{ color: '#595959' }}>
                <LockOutlined /> Waiting for approved commands...<br />
                {activeEngagement ? `Engagement: ${activeEngagement.client}` : 'No engagement selected'}
              </div>
            )}
          </Card>

          {/* Scope Gate Status */}
          <Card size="small" style={{ marginTop: 16 }} title={<span><LockOutlined /> Scope Gate Status</span>}>
            <Space>
              <Tag color="green">Active</Tag>
              <Typography.Text type="secondary">
                {activeEngagement ? `Scope: ${activeEngagement.scope}` : 'No scope loaded'}
              </Typography.Text>
            </Space>
          </Card>
        </div>
      ),
    },
    {
      key: 'audit',
      label: 'Audit Trail',
      children: (
        <div>
          <Typography.Title level={5}>Resolved Approvals</Typography.Title>
          <Table
            columns={approvalColumns.filter(c => (c as any).key !== 'actions')}
            dataSource={resolvedApprovals}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No resolved approvals' }}
          />

          <Divider />
          <Typography.Title level={5}>Session Log</Typography.Title>
          <Timeline
            items={sessionLog.slice(0, 20).map(log => ({
              color: log.action === 'executed' ? 'green' : log.action === 'blocked' ? 'red' : log.action === 'denied' ? 'orange' : 'blue',
              children: (
                <div>
                  <Space>
                    <Tag>{log.agent}</Tag>
                    <Tag color={log.action === 'executed' ? 'green' : log.action === 'blocked' ? 'red' : 'default'}>{log.action}</Tag>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{new Date(log.created_at).toLocaleString()}</Typography.Text>
                  </Space>
                  <div style={{ marginTop: 4 }}>{log.summary}</div>
                </div>
              ),
            }))}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3}>{t('execution.title')}</Typography.Title>
      <Tabs items={tabItems} />

      {/* Deny Modal */}
      <Modal
        title={t('execution.deny') + ' Command'}
        open={denyModal.open}
        onOk={handleDeny}
        onCancel={() => { setDenyModal({ open: false, id: null }); setDenyReason(''); }}
      >
        <Input.TextArea
          placeholder="Reason for denial (optional)"
          value={denyReason}
          onChange={e => setDenyReason(e.target.value)}
          rows={3}
        />
      </Modal>

      {/* New Task Modal */}
      <Modal title="New Task" open={taskModal} onCancel={() => setTaskModal(false)}
        onOk={() => { setTaskModal(false); message.info('Task queued for approval'); }}>
        <Form layout="vertical" size="small">
          <Form.Item label="Agent">
            <Select placeholder="Select agent" options={[
              { value: 'recon-advisor', label: 'recon-advisor (Tier 2)' },
              { value: 'vuln-scanner', label: 'vuln-scanner (Tier 2)' },
              { value: 'web-hunter', label: 'web-hunter (Tier 2)' },
              { value: 'ad-attacker', label: 'ad-attacker (Tier 2)' },
            ]} />
          </Form.Item>
          <Form.Item label="Command">
            <Input.TextArea rows={3} placeholder="e.g. nmap -sV 192.168.1.0/24" />
          </Form.Item>
          <Form.Item label="Noise Level">
            <Select defaultValue="MODERATE" options={[
              { value: 'QUIET', label: t('execution.noise.QUIET') },
              { value: 'MODERATE', label: t('execution.noise.MODERATE') },
              { value: 'LOUD', label: t('execution.noise.LOUD') },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExecutionCenter;
