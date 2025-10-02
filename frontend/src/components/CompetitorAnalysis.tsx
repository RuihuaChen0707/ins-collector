import { useState } from 'react';
import { Card, Table, Button, Tag, Row, Col, Statistic, Spin, Alert, DatePicker, Space } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChartOutlined, SyncOutlined, TeamOutlined, InstagramOutlined } from '@ant-design/icons';
import { instagramAPI, analysisAPI } from '@/services/api';
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function CompetitorAnalysis() {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  const queryClient = useQueryClient();

  // 获取竞品分析数据
  const { data: competitorData, isLoading: loadingCompetitors, error: competitorError } = useQuery(
    'competitorAnalysis',
    () => instagramAPI.getCompetitorAnalysis().then(res => res.data)
  );

  // 获取竞争对手基准测试
  const { data: benchmarkData, isLoading: loadingBenchmark } = useQuery(
    ['competitorBenchmark', dateRange[0].diff(dateRange[1], 'days')],
    () => analysisAPI.getCompetitorBenchmark(Math.abs(dateRange[0].diff(dateRange[1], 'days'))).then(res => res.data),
    {
      enabled: !!dateRange
    }
  );

  // 触发数据抓取
  const scrapeMutation = useMutation(
    (usernames: string[]) => instagramAPI.scrapeAccounts({ usernames, max_posts: 50, include_comments: true }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('competitorAnalysis');
      },
    }
  );

  const targetCompetitors = ['51talkksa', 'novakid_mena', 'vipkid_ar'];

  const handleScrapeData = () => {
    scrapeMutation.mutate(targetCompetitors);
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    if (dates) {
      setDateRange(dates);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'green';
      case 'negative':
        return 'red';
      case 'neutral':
        return 'gray';
      default:
        return 'blue';
    }
  };

  // 准备基准测试图表数据
  const benchmarkChartData = benchmarkData?.competitor_data ? 
    Object.entries(benchmarkData.competitor_data).map(([name, data]: [string, any]) => ({
      name,
      engagement: data.avg_engagement_rate * 100, // 转换为百分比
      followers: data.followers_count,
      posts: data.total_posts,
      diversity: data.content_diversity,
    })) : [];

  // 基准测试图表配置
  const benchmarkConfig = {
    data: benchmarkChartData,
    xField: 'name',
    yField: 'engagement',
    label: {
      position: 'top',
      formatter: (datum: any) => `${datum.engagement.toFixed(2)}%`,
    },
    color: '#3b82f6',
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: '互动率',
          value: `${datum.engagement.toFixed(2)}%`,
        };
      },
    },
  };

  const columns = [
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
      sorter: (a: any, b: any) => a.followers_count - b.followers_count,
    },
    {
      title: '帖子数',
      dataIndex: 'total_posts',
      key: 'total_posts',
      sorter: (a: any, b: any) => a.total_posts - b.total_posts,
    },
    {
      title: '平均互动率',
      dataIndex: 'avg_engagement_rate',
      key: 'avg_engagement_rate',
      render: (value: number) => (
        <div>
          <div>{(value * 100).toFixed(2)}%</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {value > 0.05 ? '优秀' : value > 0.02 ? '良好' : '需改进'}
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.avg_engagement_rate - b.avg_engagement_rate,
    },
    {
      title: '主要内容类型',
      dataIndex: 'content_category_distribution',
      key: 'content_category',
      render: (distribution: Record<string, number>) => {
        if (!distribution) return '-';
        const mainCategories = Object.entries(distribution)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2);
        return (
          <div>
            {mainCategories.map(([category, count]) => (
              <Tag key={category} color="blue" style={{ margin: '2px' }}>
                {category}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: '最后更新',
      dataIndex: 'last_updated',
      key: 'last_updated',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => setSelectedCompetitor(record.username)}
          >
            详细分析
          </Button>
        </Space>
      ),
    },
  ];

  if (loadingCompetitors) {
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
      {/* 头部操作区 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={12}>
          <Space>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={handleScrapeData}
              loading={scrapeMutation.isLoading}
            >
              更新数据
            </Button>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              defaultValue={[dayjs().subtract(30, 'days'), dayjs()]}
            />
          </Space>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Space>
            <Button icon={<BarChartOutlined />}>
              导出报告
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 关键指标 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic
              title="竞品总数"
              value={competitorData?.length || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均互动率"
              value={competitorData?.reduce((sum, comp) => sum + comp.avg_engagement_rate, 0) / (competitorData?.length || 1) * 100 || 0}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总帖子数"
              value={competitorData?.reduce((sum, comp) => sum + comp.total_posts, 0) || 0}
              prefix={<InstagramOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 基准测试图表 */}
      {loadingBenchmark ? (
        <div className="flex justify-center items-center h-64 mb-6">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card title="竞品基准测试 - 互动率对比">
              {benchmarkChartData.length > 0 ? (
                <Bar {...benchmarkConfig} height={300} />
              ) : (
                <div className="flex justify-center items-center h-[300px] text-gray-500">
                  暂无基准测试数据
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* SWOT分析 */}
      {benchmarkData && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={6}>
            <Card title="优势 (Strengths)" style={{ backgroundColor: '#f0f9ff' }}>
              {benchmarkData.strengths?.map((strength: string, index: number) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <Tag color="green">{strength}</Tag>
                </div>
              ))}
            </Card>
          </Col>
          <Col span={6}>
            <Card title="劣势 (Weaknesses)" style={{ backgroundColor: '#fef2f2' }}>
              {benchmarkData.weaknesses?.map((weakness: string, index: number) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <Tag color="red">{weakness}</Tag>
                </div>
              ))}
            </Card>
          </Col>
          <Col span={6}>
            <Card title="机会 (Opportunities)" style={{ backgroundColor: '#fffbeb' }}>
              {benchmarkData.opportunities?.map((opportunity: string, index: number) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <Tag color="gold">{opportunity}</Tag>
                </div>
              ))}
            </Card>
          </Col>
          <Col span={6}>
            <Card title="威胁 (Threats)" style={{ backgroundColor: '#fdf4ff' }}>
              {benchmarkData.threats?.map((threat: string, index: number) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <Tag color="purple">{threat}</Tag>
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      )}

      {/* 推荐策略 */}
      {benchmarkData?.recommendations && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card title="推荐策略" style={{ backgroundColor: '#f0fdf4' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {benchmarkData.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '4px' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{index + 1}.</span>
                    {recommendation}
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* 竞品详细表格 */}
      <Card title="竞品详细数据" className="mb-6">
        <Table
          dataSource={competitorData || []}
          columns={columns}
          rowKey="username"
          pagination={false}
          loading={loadingCompetitors}
        />
      </Card>
    </div>
  );
}