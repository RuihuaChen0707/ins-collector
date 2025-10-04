import { useState, useEffect } from 'react';
import { instagramAPI, analysisAPI } from '@/services/api';

interface CompetitorData {
  username: string;
  full_name?: string;
  followers_count: number;
  posts_count: number;
  avg_engagement_rate: number;
  content_category_distribution: Record<string, number>;
}

export default function SimpleDashboard() {
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await instagramAPI.getCompetitorAnalysis();
      setCompetitors(response.data.competitors);
      setError(null);
    } catch (err) {
      setError('数据加载失败');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div style={styles.container}>
      <h1 style={styles.title}>沙特K12竞品Instagram分析仪表盘</h1>
      
      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : (
        <div>
          <div style={styles.summary}>
            <h2>核心指标</h2>
            <div style={styles.metrics}>
              <div style={styles.metricCard}>
                <h3>竞品总数</h3>
                <p style={styles.metricValue}>{competitors.length}</p>
              </div>
              <div style={styles.metricCard}>
                <h3>总粉丝数</h3>
                <p style={styles.metricValue}>
                  {competitors.reduce((sum, comp) => sum + comp.followers_count, 0).toLocaleString()}
                </p>
              </div>
              <div style={styles.metricCard}>
                <h3>平均互动率</h3>
                <p style={styles.metricValue}>
                  {(competitors.reduce((sum, comp) => sum + comp.avg_engagement_rate, 0) / competitors.length * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          <div style={styles.competitors}>
            <h2>竞品分析</h2>
            <div style={styles.competitorGrid}>{competitors.map((competitor) => (
                <div key={competitor.username} style={styles.competitorCard}>
                  <h3>@{competitor.username}</h3>
                  <p>{competitor.full_name}</p>
                  <div style={styles.stats}>
                    <div>
                      <strong>粉丝数:</strong> {competitor.followers_count.toLocaleString()}
                    </div>
                    <div>
                      <strong>帖子数:</strong> {competitor.posts_count.toLocaleString()}
                    </div>
                    <div>
                      <strong>互动率:</strong> {(competitor.avg_engagement_rate * 100).toFixed(2)}%
                    </div>
                  </div>
                  
                  <div style={styles.categories}>
                    <h4>内容分类分布</h4>
                    {Object.entries(competitor.content_category_distribution).map(([category, count]) => (
                      <div key={category} style={styles.categoryItem}>
                        <span>{category}: </span>
                        <span style={styles.categoryCount}>{count} 帖子</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.button} onClick={fetchData}>
              🔄 刷新数据
            </button>
            <button style={styles.button} onClick={() => setCurrentView('details')}>
              📊 查看详情
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  title: {
    textAlign: 'center' as const,
    color: '#1a1a1a',
    fontSize: '28px',
    marginBottom: '30px',
    fontWeight: 'bold'
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '18px',
    color: '#666'
  },
  error: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '18px',
    color: '#ff4d4f',
    backgroundColor: '#fff1f0',
    borderRadius: '8px'
  },
  summary: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  metricCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center' as const
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1890ff',
    margin: '10px 0 0 0'
  },
  competitors: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  competitorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  competitorCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e8e8e8'
  },
  stats: {
    margin: '15px 0',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  categories: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #e8e8e8'
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  categoryCount: {
    color: '#1890ff',
    fontWeight: 'bold'
  },
  actions: {
    textAlign: 'center' as const,
    marginTop: '30px'
  },
  button: {
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    margin: '0 10px',
    transition: 'background-color 0.3s'
  }
};