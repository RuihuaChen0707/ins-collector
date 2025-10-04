import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Statistic, Spin, Alert, DatePicker, Space, Tag, Timeline } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChartOutlined, SyncOutlined, CalendarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { analysisAPI } from '@/services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function TrendAnalysis() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [analysisPeriod, setAnalysisPeriod] = useState<'string' | 'weekly' | 'monthly'>('weekly');
  
  const queryClient = useQueryClient();

  // 获取最新趋势分析
  const { data: latestTrends, isLoading: loadingLatest, error: latestError } = useQuery(
    'latestTrends',
    () => analysisAPI.getLatestTrends().then(res => res.data),
    {
      refetchInterval: 600000, // 10分钟刷新一次
    }
  );

  // 生成趋势分析
  const generateTrendMutation = useMutation(
    (period: string) => analysisAPI.generateTrendAnalysis(period),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('latestTrends');
      },
    }
  );

  // 获取互动表现数据
  const { data: engagementPerformance, isLoading: loadingEngagement } = useQuery(
    ['engagementPerformance', dateRange, selectedCompetitor],
    () => analysisAPI.getEngagementPerformance({
      days: Math.abs(dateRange[0].diff(dateRange[1], 'days')),
    }).then(res => res.data),
    {
      enabled: !!dateRange
    }
  );

  // 准备趋势数据
  const [trendChartData, setTrendChartData] = useState<any[]>([]);
  const [hashtagData, setHashtagData] = useState<any[]>([]);
  const [engagementTrendData, setEngagementTrendData] = useState<any[]>([]);

  useEffect(() => {
    if (latestTrends) {
      // 处理热门标签数据
      if (latestTrends.trending_hashtags) {
        const hashtagChartData = Object.entries(latestTrends.trending_hashtags)
          .slice(0, 10) // 只显示前10个
          .map(([hashtag, count]) => ({
            hashtag,
            count,
            type: '热门标签',
          }));
        setHashtagData(hashtagChartData);
      }

      // 处理互动趋势数据
      if (latestTrends.engagement_trends) {
        const engagementData = Object.entries(latestTrends.engagement_trends).map(([date, engagement]) => ({
          date,
          engagement: Number(engagement),
        }));
        setEngagementTrendData(engagementData);
      }
    }
  }, [latestTrends]);

  useEffect(() => {
    if (engagementPerformance?.engagement_by_category) {
      const trendData = Object.entries(engagementPerformance.engagement_by_category).map(([category, rate]) => ({
        category,
        engagement: Number(rate) * 100,
      }));
      setTrendChartData(trendData);
    }
  }, [engagementPerformance]);

  const handleGenerateTrends = () => {
    generateTrendMutation.mutate(analysisPeriod);
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    if (dates) {
      setDateRange(dates);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpOutlined style={{ color: '#10b981' }} />;
      case 'down':
        return <ArrowDownOutlined style={{ color: '#ef4444' }} />;
      default:
        return <LineChartOutlined style={{ color: '#6b7280' }} />;
    }
  };

  // 热门标签图表配置
  const hashtagConfig = {
    data: hashtagData,
    xField: 'count',
    yField: 'hashtag',
    seriesField: 'type',
    legend: {
      position: 'top-left',
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: '使用次数',
          value: datum.count,
        };
      },
    },
  };

  // 互动趋势图表配置
  const engagementTrendConfig = {
    data: engagementTrendData,
    xField: 'date',
    yField: 'engagement',
    smooth: true,
    color: '#3b82f6',
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: '互动率',
          value: `${(datum.engagement * 100).toFixed(2)}%`,
        };
      },
    },
  };

  // 内容分类表现图表配置
  const categoryPerformanceConfig = {
    data: trendChartData,
    xField: 'category',
    yField: 'engagement',
    label: {
      position: 'top',
      formatter: (datum: any) => `${datum.engagement.toFixed(2)}%`,
    },
    color: '#10b981',
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: '平均互动率',
          value: `${datum.engagement.toFixed(2)}%`,
        };
      },
    },
  };

  if (loadingLatest) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (latestError) {
    return (
      <Alert
        message="数据加载失败"
        description="无法加载趋势分析数据，请稍后重试。"
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
              onClick={handleGenerateTrends}
              loading={generateTrendMutation.isLoading}
            >
              生成趋势分析
            </Button>
            <Select
              value={analysisPeriod}
              onChange={setAnalysisPeriod}
              style={{ width: 120 }}
            >
              <Option value="daily">日度</Option>
              <Option value="weekly">周度</Option>
              <Option value="monthly">月度</Option>
            </Select>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              defaultValue={[dayjs().subtract(30, 'days'), dayjs()]}
            />
          </Space>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Space>
            <Button icon={<CalendarOutlined />}>
              导出报告
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 关键趋势指标 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="热门标签数"
              value={Object.keys(latestTrends?.trending_hashtags || {}).length}
              prefix={<TrendingUpOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均互动率"
              value={engagementPerformance?.average_engagement_rate * 100 || 0}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最佳表现分类"
              value={engagementPerformance?.best_performing_category || '暂无'}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="分析期间"
              value={`${Math.abs(dateRange[0].diff(dateRange[1], 'days'))}天`}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 热门标签趋势 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24}>
          <Card title="热门标签趋势">
            {hashtagData.length > 0 ? (
              <Column {...hashtagConfig} height={300} />
            ) : (
              <div className="flex justify-center items-center h-[300px] text-gray-500">
                暂无热门标签数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 互动趋势和内容分类表现 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={12}>
          <Card title="互动率趋势">
            {engagementTrendData.length > 0 ? (
              <Line {...engagementTrendConfig} height={250} />
            ) : (
              <div className="flex justify-center items-center h-[250px] text-gray-500">
                暂无趋势数据
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="内容分类表现">
            {trendChartData.length > 0 ? (
              <Column {...categoryPerformanceConfig} height={250} />
            ) : (
              <div className="flex justify-center items-center h-[250px] text-gray-500">
                暂无分类表现数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 市场洞察 */}
      {latestTrends?.market_insights && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card title="市场洞察" style={{ backgroundColor: '#f0f9ff' }}>
              <Timeline
                items={latestTrends.market_insights.split(';').map((insight: string, index: number) => ({
                  children: insight.trim(),
                  color: index % 2 === 0 ? 'blue' : 'green',
                }))}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 推荐策略 */}
      {latestTrends?.recommended_strategies && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card title="推荐策略" style={{ backgroundColor: '#fffbeb' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {latestTrends.recommended_strategies.map((strategy: string, index: number) => (
                  <div key={index} style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                    <Space>
                      <Tag color="gold">{index + 1}</Tag>
                      <span>{strategy}</span>
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* 最佳发布时间 */}
      {latestTrends?.optimal_posting_times && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="最佳发布时间建议" style={{ backgroundColor: '#f0fdf4' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <h4>推荐发布时间 (沙特时间)</h4>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {latestTrends.optimal_posting_times.best_hours?.map((hour: number, index: number) => (
                      <Card key={index} size="small" style={{ backgroundColor: '#fff' }}>
                        <Space>
                          {getTrendIcon('up')}
                          <span style={{ fontWeight: 'bold' }}>{hour.toString().padStart(2, '0')}:00</span>
                          <Tag color="green">最佳</Tag>
                        </Space>
                      </Card>
                    ))}
                  </Space>
                </Col>
                <Col span={12}>
                  <h4>发布时间优化建议</h4>
                  <Timeline
                    items={[
                      {
                        color: 'green',
                        children: '工作日晚间 (18:00-22:00) 是最佳发布时间',
                      },
                      {
                        color: 'blue',
                        children: '周末下午也有不错的表现',
                      },
                      {
                        color: 'orange',
                        children: '避免在凌晨和上午发布内容',
                      },
                      {
                        color: 'purple',
                        children: '保持一致的发布频率',
                      },
                    ]}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}