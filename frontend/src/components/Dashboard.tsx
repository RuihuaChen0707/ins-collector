import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Spin, Alert } from 'antd';
import { 
  InstagramOutlined, 
  TeamOutlined, 
  HeartOutlined, 
  CommentOutlined,
  TrendingUpOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { instagramAPI, analysisAPI } from '@/services/api';
import { Line, Pie, Bar } from 'recharts';

const { Title } = Card;

interface CompetitorData {
  username: string;
  followers_count: number;
  total_posts: number;
  avg_engagement_rate: number;
  content_category_distribution: Record<string, number>;
  last_updated: string;
}

interface SentimentData {
  period_days: number;
  total_analyses: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  average_sentiment_score: number;
  overall_sentiment: string;
}

export default function Dashboard() {
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // 获取竞品分析数据
  const { data: competitorData, isLoading: loadingCompetitors, error: competitorError } = useQuery(
    'competitorAnalysis',
    () => instagramAPI.getCompetitorAnalysis().then(res => res.data),
    {
      refetchInterval: 300000, // 5分钟刷新一次
    }
  );

  // 获取情感分析数据
  const { data: sentimentData, isLoading: loadingSentiment } = useQuery(
    'sentimentOverview',
    () => analysisAPI.getSentimentOverview(30).then(res => res.data)
  );

  // 获取内容分类分布
  const { data: categoryDistribution, isLoading: loadingCategories } = useQuery(
    'categoryDistribution',
    () => analysisAPI.getCategoryDistribution().then(res => res.data)
  );

  // 处理图表数据
  useEffect(() => {
    if (competitorData) {
      // 处理互动率趋势数据
      const engagementTrend = competitorData.map((competitor: CompetitorData) => ({
        name: competitor.username,
        engagement: competitor.avg_engagement_rate,
        followers: competitor.followers_count,
        posts: competitor.total_posts,
      }));
      setEngagementData(engagementTrend);
    }

    if (categoryDistribution?.category_distribution) {
      // 处理分类分布数据
      const pieData = Object.entries(categoryDistribution.category_distribution).map(([category, count]) => ({
        type: category,
        value: count,
      }));
      setCategoryData(pieData);
    }
  }, [competitorData, categoryDistribution]);

  // 互动率趋势图配置
  const engagementConfig = {
    data: engagementData,
    xField: 'name',
    yField: 'engagement',
    label: {
      position: 'top',
    },
    color: '#3b82f6',
    tooltip: {
      formatter: (datum: any) => {
        return { name: '互动率', value: `${(datum.engagement * 100).toFixed(2)}%` };
      },
    },
  };

  // 内容分类饼图配置
  const categoryConfig = {
    data: categoryData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };

  if (loadingCompetitors || loadingSentiment || loadingCategories) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (competitorError) {
    return (
      <Alert
        message="数据加载失败"
        description="无法加载竞品分析数据，请稍后重试。"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="p-6">
      <Row gutter={[16, 16]}>
        {/* 主要指标卡片 */}
        <Col span={6}>
          <Card className="metric-card">
            <Statistic
              title="总粉丝数"
              value={competitorData?.reduce((sum: number, comp: CompetitorData) => sum + comp.followers_count, 0) || 0}
              prefix={<TeamOutlined />}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <Statistic
              title="总帖子数"
              value={competitorData?.reduce((sum: number, comp: CompetitorData) => sum + comp.total_posts, 0) || 0}
              prefix={<InstagramOutlined />}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Statistic
              title="平均互动率"
              value={competitorData?.reduce((sum: number, comp: CompetitorData) => sum + comp.avg_engagement_rate, 0) / (competitorData?.length || 1) * 100 || 0}
              prefix={<HeartOutlined />}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <Statistic
              title="情感分析"
              value={sentimentData?.overall_sentiment || 'neutral'}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: sentimentData?.overall_sentiment === 'positive' ? '#10b981' : sentimentData?.overall_sentiment === 'negative' ? '#ef4444' : '#6b7280' }}
            />
          </Card>
        </Col>

        {/* 竞品对比图表 */}
        <Col span={12}>
          <Card className="dashboard-card">
            <Title level={4}>竞品互动率对比</Title>
            {engagementData.length > 0 ? (
              <Bar {...engagementConfig} height={300} />
            ) : (
              <div className="flex justify-center items-center h-[300px] text-gray-500">
                暂无数据
              </div>
            )}
          </Card>
        </Col>

        {/* 内容分类分布 */}
        <Col span={12}>
          <Card className="dashboard-card">
            <Title level={4}>内容分类分布</Title>
            {categoryData.length > 0 ? (
              <Pie {...categoryConfig} height={300} />
            ) : (
              <div className="flex justify-center items-center h-[300px] text-gray-500">
                暂无数据
              </div>
            )}
          </Card>
        </Col>

        {/* 竞品详细数据表格 */}
        <Col span={24}>
          <Card className="dashboard-card">
            <Title level={4}>竞品详细数据</Title>
            <Table
              dataSource={competitorData || []}
              columns={[
                {
                  title: '竞品账号',
                  dataIndex: 'username',
                  key: 'username',
                  render: (text: string) => (
                    <a href={`https://instagram.com/${text}`} target="_blank" rel="noopener noreferrer">
                      @{text}
                    </a>
                  ),
                },
                {
                  title: '粉丝数',
                  dataIndex: 'followers_count',
                  key: 'followers_count',
                  render: (value: number) => value.toLocaleString(),
                },
                {
                  title: '帖子数',
                  dataIndex: 'total_posts',
                  key: 'total_posts',
                },
                {
                  title: '平均互动率',
                  dataIndex: 'avg_engagement_rate',
                  key: 'avg_engagement_rate',
                  render: (value: number) => (
                    <Progress
                      percent={Number((value * 100).toFixed(2))}
                      size="small"
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  ),
                },
                {
                  title: '主要内容类型',
                  dataIndex: 'content_category_distribution',
                  key: 'content_category',
                  render: (distribution: Record<string, number>) => {
                    if (!distribution) return '-';
                    const mainCategory = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0];
                    return mainCategory ? (
                      <Tag color="blue">{mainCategory[0]}</Tag>
                    ) : '-';
                  },
                },
                {
                  title: '最后更新',
                  dataIndex: 'last_updated',
                  key: 'last_updated',
                  render: (date: string) => new Date(date).toLocaleDateString(),
                },
              ]}
              rowKey="username"
              pagination={false}
            />
          </Card>
        </Col>

        {/* 情感分析详情 */}
        <Col span={24}>
          <Card className="dashboard-card">
            <Title level={4}>情感分析概览 (最近30天)</Title>
            {sentimentData && (
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title="积极情感"
                    value={sentimentData.sentiment_distribution.positive}
                    suffix={`/ ${sentimentData.total_analyses}`}
                    valueStyle={{ color: '#10b981' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="中性情感"
                    value={sentimentData.sentiment_distribution.neutral}
                    suffix={`/ ${sentimentData.total_analyses}`}
                    valueStyle={{ color: '#6b7280' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="消极情感"
                    value={sentimentData.sentiment_distribution.negative}
                    suffix={`/ ${sentimentData.total_analyses}`}
                    valueStyle={{ color: '#ef4444' }}
                  />
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}