import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Timeline, Card, Row, Col, Progress, Tag, Space, List, Empty, Divider } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, LockOutlined, FolderOpenOutlined, FileTextOutlined } from '@ant-design/icons';
import { PENTEST_PHASES } from '../../shared/constants';
import { useAppStore } from '../stores/appStore';
import { useFindingsStore } from '../stores/findingsStore';

const ProcessTracking = () => {
  const { t } = useTranslation();
  const { activeEngagement } = useAppStore();
  const { sessionLog, vulns, loadSessionLog, loadFindings } = useFindingsStore();

  useEffect(() => {
    if (activeEngagement) {
      loadSessionLog(activeEngagement.id);
      loadFindings(activeEngagement.id);
    }
  }, [activeEngagement]);

  // Compute phase completion based on session log actions
  const phaseProgress = PENTEST_PHASES.map(phase => {
    const phaseActions = sessionLog.filter(l => {
      const detail = (l.detail || '').toLowerCase();
      const summary = (l.summary || '').toLowerCase();
      const text = `${detail} ${summary}`;
      switch (phase.id) {
        case 'recon': return text.includes('nmap') || text.includes('shodan') || text.includes('scan');
        case 'enum': return text.includes('enum') || text.includes('bloodhound') || text.includes('gobuster') || text.includes('ffuf');
        case 'vuln-analysis': return text.includes('nuclei') || text.includes('nikto') || text.includes('vuln') || text.includes('cve');
        case 'exploitation': return text.includes('sqlmap') || text.includes('kerberoast') || text.includes('exploit') || text.includes('impacket');
        case 'post-exploitation': return text.includes('dcsync') || text.includes('pivot') || text.includes('lateral') || text.includes('hashcat');
        case 'reporting': return text.includes('report') || text.includes('export');
        default: return false;
      }
    });
    const hasVulns = phase.id === 'exploitation' && vulns.some(v => v.status === 'exploited');
    const pct = phaseActions.length > 0 ? Math.min(100, phaseActions.length * 30 + (hasVulns ? 20 : 0)) : 0;
    return { ...phase, count: phaseActions.length, percent: pct };
  });

  const overallProgress = phaseProgress.length > 0
    ? Math.round(phaseProgress.reduce((s, p) => s + p.percent, 0) / phaseProgress.length)
    : 0;

  // Mock evidence files
  const evidenceFiles = sessionLog
    .filter(l => l.action === 'executed' && l.detail)
    .map((l, i) => ({
      name: `${l.agent}_${new Date(l.created_at).toISOString().slice(0, 10)}.log`,
      agent: l.agent,
      size: `${(Math.random() * 50 + 5).toFixed(1)} KB`,
      date: l.created_at,
    }));

  const phaseColors: Record<string, string> = {
    recon: '#00f0ff',
    enum: '#4d7cff',
    'vuln-analysis': '#ff6b00',
    exploitation: '#ff073a',
    'post-exploitation': '#bf00ff',
    reporting: '#39ff14',
  };

  return (
    <div>
      <Typography.Title level={3} className="neon-title">{t('process.title')}</Typography.Title>

      {!activeEngagement && (
        <Typography.Text type="secondary">Select an engagement from the Dashboard to track progress.</Typography.Text>
      )}

      <Row gutter={[16, 16]}>
        {/* Attack Chain Progress */}
        <Col span={12}>
          <Card
            title={<span>{t('process.attackChain')}</span>}
            extra={<Tag color={overallProgress >= 80 ? 'green' : overallProgress >= 40 ? 'orange' : 'default'}>{overallProgress}% overall</Tag>}
          >
            {phaseProgress.map((phase) => (
              <div key={phase.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Space>
                    {phase.percent >= 80 ? (
                      <CheckCircleOutlined style={{ color: '#39ff14' }} />
                    ) : phase.percent > 0 ? (
                      <ClockCircleOutlined style={{ color: '#ff6b00' }} className="neon-pulse" />
                    ) : (
                      <LockOutlined style={{ color: '#555570' }} />
                    )}
                    <Typography.Text style={{ color: '#e8e8f0' }}>{phase.label}</Typography.Text>
                  </Space>
                  <Space>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {phase.count} action{phase.count !== 1 ? 's' : ''}
                    </Typography.Text>
                    <Typography.Text style={{ color: phaseColors[phase.id] || '#8888aa' }}>{phase.percent}%</Typography.Text>
                  </Space>
                </div>
                <Progress
                  percent={phase.percent}
                  size="small"
                  showInfo={false}
                  strokeColor={phaseColors[phase.id]}
                  trailColor="#1a1a35"
                />
              </div>
            ))}

            <Divider />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Progress computed from session log actions. Each phase activates when matching tool output is detected.
            </Typography.Text>
          </Card>
        </Col>

        {/* Event Timeline */}
        <Col span={12}>
          <Card title={t('process.timeline')} bodyStyle={{ maxHeight: 500, overflow: 'auto' }}>
            {sessionLog.length > 0 ? (
              <Timeline
                items={sessionLog.map(log => ({
                  color: log.action === 'executed' ? '#39ff14' : log.action === 'blocked' ? '#ff073a' : log.action === 'denied' ? '#ff6b00' : '#4d7cff',
                  children: (
                    <div>
                      <Space>
                        <Tag color="cyan">{log.agent}</Tag>
                        <Tag color={log.action === 'executed' ? 'green' : log.action === 'blocked' ? 'red' : 'default'}>{log.action}</Tag>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {new Date(log.created_at).toLocaleString()}
                        </Typography.Text>
                      </Space>
                      <div style={{ marginTop: 4, color: '#e8e8f0' }}>{log.summary}</div>
                      {log.detail && (
                        <div className="terminal-block" style={{ marginTop: 4, padding: '4px 8px', fontSize: 11 }}>
                          {log.detail}
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="No events recorded" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Evidence Browser */}
      <Card title={<span><FolderOpenOutlined style={{ color: '#39ff14' }} /> {t('process.evidence')}</span>} style={{ marginTop: 16 }}>
        {evidenceFiles.length > 0 ? (
          <List
            size="small"
            dataSource={evidenceFiles}
            renderItem={(item) => (
              <List.Item
                extra={
                  <Space>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{item.size}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(item.date).toLocaleDateString()}
                    </Typography.Text>
                  </Space>
                }
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ color: '#00f0ff' }} />}
                  title={<Typography.Text code style={{ fontSize: 12, color: '#39ff14' }}>{item.name}</Typography.Text>}
                  description={<Tag color="cyan">{item.agent}</Tag>}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No evidence files yet. Evidence is generated when commands are executed." />
        )}
      </Card>
    </div>
  );
};

export default ProcessTracking;
