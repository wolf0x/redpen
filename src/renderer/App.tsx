import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Space, Dropdown } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  FileTextOutlined,
  SettingOutlined,
  BranchesOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from './stores/appStore';
import Dashboard from './pages/Dashboard';
import Engagement from './pages/Engagement';
import AgentConsole from './pages/AgentConsole';
import ExecutionCenter from './pages/ExecutionCenter';
import FindingsCenter from './pages/FindingsCenter';
import ReportCenter from './pages/ReportCenter';
import ConfigCenter from './pages/ConfigCenter';
import ProcessTracking from './pages/ProcessTracking';

const { Header, Sider, Content } = Layout;

const App = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang } = useAppStore();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: t('nav.dashboard') },
    { key: '/engagements', icon: <TeamOutlined />, label: t('nav.engagements') },
    { key: '/agents', icon: <RobotOutlined />, label: t('nav.agents') },
    { key: '/execution', icon: <ThunderboltOutlined />, label: t('nav.execution') },
    { key: '/findings', icon: <SearchOutlined />, label: t('nav.findings') },
    { key: '/reports', icon: <FileTextOutlined />, label: t('nav.reports') },
    { key: '/config', icon: <SettingOutlined />, label: t('nav.config') },
    { key: '/process', icon: <BranchesOutlined />, label: t('nav.process') },
  ];

  const langMenu = {
    items: [
      { key: 'zh', label: '中文' },
      { key: 'en', label: 'English' },
    ],
    onClick: ({ key }: { key: string }) => setLang(key as 'zh' | 'en'),
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <div className="scanline-overlay" />
      <Sider width={220} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1e1e3a' }}>
          <span className="redpen-logo">RedPen</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ paddingTop: 8 }}
        />
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#555570', letterSpacing: 2, textTransform: 'uppercase' }}>
            v0.1.0 · Pentest AI
          </div>
        </div>
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#555570' }}>
            {location.pathname === '/' ? 'DASHBOARD' : location.pathname.slice(1).toUpperCase().replace('/', ' · ')}
          </div>
          <Space>
            <Dropdown menu={langMenu} placement="bottomRight">
              <Button icon={<GlobalOutlined />} type="text" style={{ color: '#00f0ff' }}>
                {lang === 'zh' ? '中文' : 'EN'}
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 24, padding: 24, borderRadius: 10, minHeight: 280, position: 'relative' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/engagements" element={<Engagement />} />
            <Route path="/engagements/:id" element={<Engagement />} />
            <Route path="/agents" element={<AgentConsole />} />
            <Route path="/execution" element={<ExecutionCenter />} />
            <Route path="/findings" element={<FindingsCenter />} />
            <Route path="/reports" element={<ReportCenter />} />
            <Route path="/config" element={<ConfigCenter />} />
            <Route path="/process" element={<ProcessTracking />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
