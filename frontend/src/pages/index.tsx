import { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { 
  DashboardOutlined, 
  InstagramOutlined, 
  BarChartOutlined, 
  TeamOutlined,
  TrendingUpOutlined
} from '@ant-design/icons';
import Dashboard from '@/components/Dashboard';
import CompetitorAnalysis from '@/components/CompetitorAnalysis';
import ContentAnalysis from '@/components/ContentAnalysis';
import TrendAnalysis from '@/components/TrendAnalysis';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '总览',
  },
  {
    key: 'competitors',
    icon: <TeamOutlined />,
    label: '竞品分析',
  },
  {
    key: 'content',
    icon: <InstagramOutlined />,
    label: '内容分析',
  },
  {
    key: 'trends',
    icon: <TrendingUpOutlined />,
    label: '趋势分析',
  },
];

export default function Home() {
  const [selectedKey, setSelectedKey] = useState('dashboard');

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <Dashboard />;
      case 'competitors':
        return <CompetitorAnalysis />;
      case 'content':
        return <ContentAnalysis />;
      case 'trends':
        return <TrendAnalysis />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={250}
        style={{
          background: '#fff',
          boxShadow: '2px 0 6px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            沙特K12竞品分析
          </Title>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '12px' }}>
            Instagram 数据仪表盘
          </p>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => setSelectedKey(key)}
          items={menuItems}
          style={{ border: 'none', marginTop: '16px' }}
        />
      </Sider>
      
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            {menuItems.find(item => item.key === selectedKey)?.label || '总览'}
          </Title>
        </Header>
        
        <Content style={{ margin: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 120px)' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}