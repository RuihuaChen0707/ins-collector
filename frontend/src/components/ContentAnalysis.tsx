import { useState } from 'react';
import { Card, Table, Button, Tag, Row, Col, Statistic, Spin, Alert, Select, Space, Progress } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChartOutlined, SyncOutlined, InstagramOutlined, HeartOutlined, CommentOutlined } from '@ant-design/icons';
import { instagramAPI, analysisAPI } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Option } = Select;

export default function ContentAnalysis() {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // 获取帖子列表
  const { 
    data: postsData, 
    isLoading: loadingPosts, 
    error: postsError 
  } = useQuery(
    ['posts', selectedCompetitor, selectedCategory],
    () => instagramAPI.getPosts({
      account_username: selectedCompetitor || undefined,
      content_category: selectedCategory || undefined,
      limit: 50
    }).then(res => res.data),
    {
      keepPreviousData: true,
    }
  );

  // 获取内容分类分布
  const { 
    data: categoryDistribution, 
    isLoading: loadingCategories 
  } = useQuery(
    'categoryDistribution',
    () => analysisAPI.getCategoryDistribution().then(res => res.data)
  );

  // 获取竞品列表
  const { data: competitorData } = useQuery(
    'competitorAnalysis',
    () => instagramAPI.getCompetitorAnalysis().then(res => res.data)
  );

  // 内容分析突变
  const analyzeMutation = useMutation(
    (postId: string) => analysisAPI.analyzeContent(postId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('posts');
      },
    }
  );

  const handleAnalyzeContent = (postId: string) => {
    analyzeMutation.mutate(postId);
  };

  // 准备分类分布图表数据
  const categoryData = categoryDistribution?.category_distribution ?
    Object.entries(categoryDistribution.category_distribution).map(([category, count]) => ({
      type: category,
      value: count,
    })) : [];

  // 准备帖子互动率数据
  const engagementData = postsData?.map((post: any) => ({
    post_id: post.post_id,
    engagement_rate: post.engagement_rate * 100,
    likes: post.likes_count,
    comments: post.comments_count,
    category: post.content_category || '未分类',
  })) || [];

  // 分类分布饼图配置
  const categoryPieConfig = {
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

  // 互动率柱状图配置
  const engagementBarConfig = {
    data: engagementData,
    xField: 'post_id',
    yField: 'engagement_rate',
    colorField: 'category',
    label: {
      position: 'top',
      formatter: (datum: any) => `${datum.engagement_rate.toFixed(1)}%`,
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: '互动率',
          value: `${datum.engagement_rate.toFixed(2)}%`,
        };
      },
    },
  };

  const columns = [
    {
      title: '帖子ID',
      dataIndex: 'shortcode',
      key: 'shortcode',
      render: (text: string) => (
        <a href={`https://instagram.com/p/${text}`} target="_blank" rel="noopener noreferrer"
        >
          {text}
        </a>
      ),
    },
    {
      title: '内容预览',
      dataIndex: 'caption',
      key: 'caption',
      render: (text: string) => (
        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {text ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : '无标题'}
        </div>
      ),
    },
    {
      title: '账号',
      dataIndex: ['account', 'username'],
      key: 'username',
    },
    {
      title: '媒体类型',
      dataIndex: 'media_type',
      key: 'media_type',
      render: (type: string) => {
        const typeMap = {
          image: { text: '图片', color: 'blue' },
          video: { text: '视频', color: 'green' },
          carousel: { text: '轮播', color: 'purple' },
        };
        const config = typeMap[type as keyof typeof typeMap] || { text: '未知', color: 'gray' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '内容分类',
      dataIndex: 'content_category',
      key: 'content_category',
      render: (category: string) => {
        if (!category) return <Tag color="default">未分类</Tag>;
        const categoryColors = {
          '互动游戏/竞赛': 'orange',
          '促销/销售': 'red',
          '纯教育内容': 'blue',
          '品牌/社区': 'green',
          '其他': 'gray',
        };
        return <Tag color={categoryColors[category as keyof typeof categoryColors] || 'default'}>{category}</Tag>;
      },
    },
    {
      title: '点赞数',
      dataIndex: 'likes_count',
      key: 'likes_count',
      render: (value: number) => value.toLocaleString(),
      sorter: (a: any, b: any) => a.likes_count - b.likes_count,
    },
    {
      title: '评论数',
      dataIndex: 'comments_count',
      key: 'comments_count',
      render: (value: number) => value.toLocaleString(),
      sorter: (a: any, b: any) => a.comments_count - b.comments_count,
    },
    {
      title: '互动率',
      dataIndex: 'engagement_rate',
      key: 'engagement_rate',
      render: (value: number) => (
        <div>
          <div>{(value * 100).toFixed(2)}%</div>
          <Progress
            percent={value * 100}
            size="small"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            showInfo={false}
          />
        </div>
      ),
      sorter: (a: any, b: any) => a.engagement_rate - b.engagement_rate,
    },
    {
      title: '发布时间',
      dataIndex: 'posted_at',
      key: 'posted_at',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
      sorter: (a: any, b: any) => new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime(),
    },
    {
      title: '情感分数',
      dataIndex: 'sentiment_score',
      key: 'sentiment_score',
      render: (score: number) => {
        if (score === null || score === undefined) return '-';
        const color = score > 0.1 ? 'green' : score < -0.1 ? 'red' : 'gray';
        return <Tag color={color}>{score.toFixed(2)}</Tag>;
      },
      sorter: (a: any, b: any) => (a.sentiment_score || 0) - (b.sentiment_score || 0),
    },
    {
      title: '分析状态',
      key: 'analysis_status',
      render: (_: any, record: any) => {
        const hasAnalysis = record.content_category || record.sentiment_score !== null;
        if (hasAnalysis) {
          return <Tag color="green">已分析</Tag>;
        }
        return (
          <Button
            size="small"
            type="primary"
            onClick={() => handleAnalyzeContent(record.post_id)}
            loading={analyzeMutation.isLoading}
          >
            分析
          </Button>
        );
      },
    },
  ];

  if (loadingPosts) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (postsError) {
    return (
      <Alert
        message="数据加载失败"
        description="无法加载帖子数据，请稍后重试。"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="p-6">
      {/* 筛选和操作区 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={8}>
          <Space>
            <span>筛选竞品:</span>
            <Select
              style={{ width: 200 }}
              placeholder="选择竞品账号"
              value={selectedCompetitor}
              onChange={setSelectedCompetitor}
              allowClear
            >
              {competitorData?.map((competitor: any) => (
                <Option key={competitor.username} value={competitor.username}>
                  @{competitor.username}
                </Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col span={8}>
          <Space>
            <span>内容分类:</span>
            <Select
              style={{ width: 200 }}
              placeholder="选择内容分类"
              value={selectedCategory}
              onChange={setSelectedCategory}
              allowClear
            >
              <Option value="互动游戏/竞赛">互动游戏/竞赛</Option>
              <Option value="促销/销售">促销/销售</Option>
              <Option value="纯教育内容">纯教育内容</Option>
              <Option value="品牌/社区">品牌/社区</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Space>
        </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          <Space>
            <Button icon={<SyncOutlined />}>
              批量分析
            </Button>
            <Button icon={<BarChartOutlined />}>
              导出数据
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 关键指标 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="总帖子数"
              value={postsData?.length || 0}
              prefix={<InstagramOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均互动率"
              value={postsData?.reduce((sum, post) => sum + post.engagement_rate, 0) / (postsData?.length || 1) * 100 || 0}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总点赞数"
              value={postsData?.reduce((sum, post) => sum + post.likes_count, 0) || 0}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#ef4444' }}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总评论数"
              value={postsData?.reduce((sum, post) => sum + post.comments_count, 0) || 0}
              prefix={<CommentOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
      </Row>

      {/* 内容分类分布图表 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={12}>
          <Card title="内容分类分布">
            {categoryData.length > 0 ? (
              <Pie {...categoryPieConfig} height={300} />
            ) : (
              <div className="flex justify-center items-center h-[300px] text-gray-500">
                暂无分类数据
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="互动率分布">
            {engagementData.length > 0 ? (
              <Bar {...engagementBarConfig} height={300} />
            ) : (
              <div className="flex justify-center items-center h-[300px] text-gray-500">
                暂无互动率数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 帖子详细表格 */}
      <Card title="帖子详细数据">
        <Table
          dataSource={postsData || []}
          columns={columns}
          rowKey="post_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} posts`,
          }}
          loading={loadingPosts}
        />
      </Card>
    </div>
  );
}