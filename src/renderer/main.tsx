import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import App from './App';
import './i18n';
import './styles/neon.css';
import { useAppStore } from './stores/appStore';

const Root = () => {
  const lang = useAppStore((s) => s.lang);
  return (
    <ConfigProvider
      locale={lang === 'zh' ? zhCN : enUS}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00f0ff',
          colorInfo: '#00f0ff',
          colorSuccess: '#39ff14',
          colorWarning: '#ff6b00',
          colorError: '#ff073a',
          borderRadius: 8,
          colorBgContainer: '#12122a',
          colorBgElevated: '#1a1a35',
          colorBgLayout: '#0a0a14',
          colorText: '#e8e8f0',
          colorTextSecondary: '#8888aa',
          colorBorder: '#1e1e3a',
          colorBorderSecondary: '#2a2a55',
          fontFamily: "'SF Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        },
        components: {
          Table: {
            headerBg: '#0f0f1e',
            rowHoverBg: '#00f0ff08',
          },
          Card: {
            headerBg: '#1a1a35',
          },
          Menu: {
            darkItemBg: '#0a0a14',
            darkItemHoverBg: '#00f0ff12',
            darkItemSelectedBg: 'linear-gradient(135deg, #00f0ff18, #bf00ff12)',
            darkSubMenuItemBg: '#0a0a14',
            darkItemColor: '#8888aa',
            darkItemHoverColor: '#00f0ff',
            darkItemSelectedColor: '#00f0ff',
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
