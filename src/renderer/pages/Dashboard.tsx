import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Card, Row, Col, Timeline, Button, Statistic, Tag, Progress, Space, Empty } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEngagementStore } from '../stores/engagementStore';
import { useFindingsStore } from '../stores/findingsStore';
import { useAppStore } from '../stores/appStore';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { engagements, stats, loadEngagements } = useEngagementStore();
  const { sessionLog, loadSessionLog } = useFindingsStore();
  const { setActiveEngagement } = useAppStore();

  useEffect(() => {
    loadEngagements();
  }, []);

  const activeEngagements = engagements.filter(e => e.status === 'active');
  const totalStats = Object.values(stats).reduce(
    (acc, s) => ({
      hosts: acc.hosts + s.host_count,
      vulns: acc.vulns + s.vuln_count.critical + s.vuln_count.high + s.vuln_count.medium + s.vuln_count.low + s.vuln_count.info,
      creds: acc.creds + s.credential_count,
      chains: acc.chains + s.chain_count,
    }),
    { hosts: 0, vulns: 0, creds: 0, chains: 0 }
  );

  const handleResume = (eng: typeof engagements[0]) => {
    setActiveEngagement(eng);
    loadSessionLog(eng.id);
    navigate('/execution');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{t('dashboard.title')}</Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={() => loadEngagements()}>Refresh</Button>
      </div>

      {/* Stats Overview */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#1a1a2e' }}>
            <Statistic title={t('findings.hosts')} value={totalStats.hosts} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#1a1a2e' }}>
            <Statistic title={t('findings.vulns')} value={totalStats.vulns} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#1a1a2e' }}>
            <Statistic title={t('findings.creds')} value={totalStats.creds} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#1a1a2e' }}>
            <Statistic title={t('findings.chains')} value={totalStats.chains} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Active Engagements */}
        <Col span={16}>
          <Card title={t('dashboard.activeEngagements')}>
            {activeEngagements.length === 0 ? (
              <Empty description="No active engagements" />
            ) : (
              <Row gutter={[12, 12]}>
                {activeEngagements.map(eng => {
                  const s = stats[eng.id];
                  const criticalCount = s ? s.vuln_count.critical + s.vuln_count.high : 0;
                  return (
                    <Col span={12} key={eng.id}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => { setActiveEngagement(eng); navigate('/engagements'); }}
                        style={{ borderColor: criticalCount > 0 ? '#cf1322' : '#303030' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Typography.Text strong>{eng.client}</Typography.Text>
                            <div>
                              <Tag color="blue">{eng.type}</Tag>
                              {criticalCount > 0 && <Tag color="red" icon={<WarningOutlined />}>{criticalCount} Critical/High</Tag>}
                            </div>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{eng.scope}</Typography.Text>
                          </div>
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlayCircleOutlined />}
                            onClick={(e) => { e.stopPropagation(); handleResume(eng); }}
                          >
                            {t('dashboard.resume')}
                          </Button>
                        </div>
                        {s && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                              <span>{s.host_count} hosts</span>
                              <span>{s.confirmation_rate}% confirmed</span>
                            </div>
                            <Progress percent={s.chain_completion} size="small" showInfo={false} strokeColor="#722ed1" />
                          </div>
                        )}
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col span={8}>
          <Card title={t('dashboard.recentActivity')} bodyStyle={{ maxHeight: 400, overflow: 'auto' }}>
            {sessionLog.length > 0 ? (
              <Timeline
                items={sessionLog.slice(0, 10).map(log => ({
                  color: log.action === 'executed' ? 'green' : log.action === 'blocked' ? 'red' : 'blue',
                  children: (
                    <div>
                      <Typography.Text strong style={{ fontSize: 12 }}>{log.agent}</Typography.Text>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>{log.summary}</div>
                      <div style={{ fontSize: 11, color: '#595959' }}>{new Date(log.created_at).toLocaleString()}</div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="No recent activity" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Engagement Status Overview */}
      <Card title={t('dashboard.statsOverview')} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          {Object.entries(
            engagements.reduce<Record<string, number>>((acc, e) => {
              acc[e.status] = (acc[e.status] || 0) + 1;
              return acc;
            }, {})
          ).map(([status, count]) => (
            <Col key={status}>
              <Space>
                <Tag color={status === 'active' ? 'green' : status === 'completed' ? 'blue' : status === 'planning' ? 'orange' : 'default'}>
                  {t(`engagement.status.${status}`)}
                </Tag>
                <Typography.Text strong>{count}</Typography.Text>
              </Space>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
