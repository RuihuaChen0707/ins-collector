import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Instagram相关API
export const instagramAPI = {
  // 获取账户列表
  getAccounts: (params?: { skip?: number; limit?: number }) =>
    api.get('/instagram/accounts', { params }),

  // 获取特定账户
  getAccount: (username: string) =>
    api.get(`/instagram/accounts/${username}`),

  // 获取竞品分析
  getCompetitorAnalysis: () =>
    api.get('/instagram/competitors'),

  // 获取帖子列表
  getPosts: (params?: {
    skip?: number;
    limit?: number;
    account_username?: string;
    content_category?: string;
  }) => api.get('/instagram/posts', { params }),

  // 获取特定帖子
  getPost: (postId: string) =>
    api.get(`/instagram/posts/${postId}`),

  // 触发数据抓取
  scrapeAccounts: (data: {
    usernames: string[];
    max_posts?: number;
    include_comments?: boolean;
  }) => api.post('/instagram/scrape-accounts', data),
};

// 分析相关API
export const analysisAPI = {
  // 获取内容分析
  getContentAnalysis: (postId: string) =>
    api.get(`/analysis/content/${postId}`),

  // 分析内容
  analyzeContent: (postId: string) =>
    api.post(`/analysis/content/analyze/${postId}`),

  // 获取内容分类分布
  getCategoryDistribution: (params?: {
    start_date?: string;
    end_date?: string;
    account_username?: string;
  }) => api.get('/analysis/content/category-distribution', { params }),

  // 获取情感分析概览
  getSentimentOverview: (days?: number) =>
    api.get('/analysis/sentiment/overview', { params: { days } }),

  // 获取最新趋势
  getLatestTrends: () =>
    api.get('/analysis/trends/latest'),

  // 生成趋势分析
  generateTrendAnalysis: (analysis_period?: string) =>
    api.post('/analysis/trends/generate', { analysis_period }),

  // 获取竞争对手基准
  getCompetitorBenchmark: (days?: number) =>
    api.get('/analysis/competitors/benchmark', { params: { days } }),

  // 获取互动表现
  getEngagementPerformance: (params?: {
    account_username?: string;
    days?: number;
  }) => api.get('/analysis/performance/engagement', { params }),
};

export default api;