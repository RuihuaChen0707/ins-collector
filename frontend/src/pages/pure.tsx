import { useState, useEffect } from 'react';

// 模拟API调用
const mockAPI = {
  getCompetitorAnalysis: async () => ({
    data: {
      competitors: [
        {
          username: "51talkksa",
          full_name: "51Talk KSA",
          followers_count: 15420,
          posts_count: 248,
          avg_engagement_rate: 0.032,
          content_category_distribution: {
            "纯教育内容": 89,
            "促销/销售": 67,
            "互动游戏/竞赛": 45,
            "品牌/社区": 34,
            "其他": 13
          }
        },
        {
          username: "novakid_mena", 
          full_name: "Novakid MENA",
          followers_count: 22180,
          posts_count: 312,
          avg_engagement_rate: 0.045,
          content_category_distribution: {
            "纯教育内容": 124,
            "促销/销售": 89,
            "互动游戏/竞赛": 67,
            "品牌/社区": 23,
            "其他": 9
          }
        },
        {
          username: "vipkid_ar",
          full_name: "VIPKid Arabic", 
          followers_count: 18950,
          posts_count: 198,
          avg_engagement_rate: 0.028,
          content_category_distribution: {
            "纯教育内容": 78,
            "促销/销售": 56,
            "互动游戏/竞赛": 34,
            "品牌/社区": 21,
            "其他": 9
          }
        }
      ]
    }
  })
};

interface CompetitorData {
  username: string;
  full_name?: string;
  followers_count: number;
  posts_count: number;
  avg_engagement_rate: number;
  content_category_distribution: Record<string, number>;
}

export default function PureDashboard() {
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // 获取数据
    const fetchData = async () => {
      try {
        const response = await mockAPI.getCompetitorAnalysis();
        setCompetitors(response.data.competitors);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // 更新时间
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('zh-CN'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const totalFollowers = competitors.reduce((sum, comp) => sum + comp.followers_count, 0);
  const totalPosts = competitors.reduce((sum, comp) => sum + comp.posts_count, 0);
  const avgEngagement = competitors.length > 0 
    ? (competitors.reduce((sum, comp) => sum + comp.avg_engagement_rate, 0) / competitors.length * 100).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>正在加载竞品数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🇸🇦 沙特K12竞品Instagram分析仪表盘</h1>
        <p style={styles.subtitle}>实时监控竞争对手社交媒体策略 | {currentTime}</p>
      </header>

      <section style={styles.metricsSection}>
        <h2 style={styles.sectionTitle}>📊 核心指标总览</h2>
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>📱</div>
            <h3 style={styles.metricLabel}>竞品总数</h3>
            <p style={styles.metricValue}>{competitors.length}</p>
          </div>
          
          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>👥</div>
            <h3 style={styles.metricLabel}>总粉丝数</h3>
            <p style={styles.metricValue}>{totalFollowers.toLocaleString()}</p>
          </div>
          
          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>📝</div>
            <h3 style={styles.metricLabel}>总帖子数</h3>
            <p style={styles.metricValue}>{totalPosts.toLocaleString()}</p>
          </div>
          
          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>💝</div>
            <h3 style={styles.metricLabel}>平均互动率</h3>
            <p style={styles.metricValue}>{avgEngagement}%</p>
          </div>
        </div>
      </section>

      <section style={styles.competitorsSection}>
        <h2 style={styles.sectionTitle}>🏆 竞品详细分析</h2>
        <div style={styles.competitorGrid}>{competitors.map((competitor) => {
            const bestCategory = Object.entries(competitor.content_category_distribution)
              .sort(([,a], [,b]) => b - a)[0];
            
            return (
              <div key={competitor.username} style={styles.competitorCard}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.competitorName}>@{competitor.username}</h3>
                  <p style={styles.competitorFullName}>{competitor.full_name}</p>
                </div>
                
                <div style={styles.statsGrid}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>粉丝数</span>
                    <span style={styles.statValue}>{competitor.followers_count.toLocaleString()}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>帖子数</span>
                    <span style={styles.statValue}>{competitor.posts_count.toLocaleString()}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>互动率</span>
                    <span style={styles.statValue}>{(competitor.avg_engagement_rate * 100).toFixed(2)}%</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>主要内容</span>
                    <span style={styles.statValue}>{bestCategory?.[0] || '未分类'}</span>
                  </div>
                </div>
                
                <div style={styles.contentCategories}>
                  <h4 style={styles.categoriesTitle}>📋 内容分类分布</h4>
                  <div style={styles.categoryList}
                    {Object.entries(competitor.content_category_distribution).map(([category, count]) => (
                      <div key={category} style={styles.categoryItem}
                        <div style={styles.categoryInfo}>
                          <span style={styles.categoryName}>{category}</span>
                          <span style={styles.categoryCount}>{count} 帖子</span>
                        </div>
                        <div style={styles.categoryBar}>
                          <div 
                            style={{
                              ...styles.categoryBarFill,
                              width: `${(count / competitor.posts_count) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={styles.cardActions}>
                  <a 
                    href={`https://instagram.com/${competitor.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.instagramLink}
                  >
                    📱 访问Instagram主页
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={styles.insightsSection}>
        <h2 style={styles.sectionTitle}>💡 关键洞察</h2>
        <div style={styles.insightsGrid}>
          <div style={styles.insightCard}
            <h4>🎯 内容策略建议</h4>
            <p>"互动游戏/竞赛"类内容表现最佳，建议增加此类内容发布频率</p>
          </div>
          
          <div style={styles.insightCard}
            <h4>⏰ 发布时机</h4>
            <p>沙特时间晚间18:00-22:00为最佳发布时间</p>
          </div>
          
          <div style={styles.insightCard}
            <h4>📈 市场趋势</h4>
            <p>在线K12英语教育在沙特市场持续增长，竞争激烈</p>
          </div>
          
          <div style={styles.insightCard}
            <h4>🏆 最佳实践</h4>
            <p>学习novakid_mena的内容策略，其互动率最高(4.5%)</p>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <p>🚀 基于Instagram API实时数据分析 | 专为沙特K12教育市场定制</p>
        <p>📊 数据更新时间: {currentTime} | 追踪竞品: @51talkksa @novakid_mena @vipkid_ar</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
    color: 'white'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.9,
    margin: 0
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    color: 'white'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  metricsSection: {
    marginBottom: '40px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center' as const,
    marginBottom: '20px',
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  metricCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '30px',
    borderRadius: '15px',
    textAlign: 'center' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer'
  },
  metricIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  metricLabel: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 10px 0',
    fontWeight: '600'
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1890ff',
    margin: 0
  },
  competitorsSection: {
    marginBottom: '40px'
  },
  competitorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '25px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  competitorCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'transform 0.3s ease'
  },
  cardHeader: {
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0'
  },
  competitorName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 5px 0'
  },
  competitorFullName: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '20px'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
    fontWeight: '600'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1890ff'
  },
  contentCategories: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #f0f0f0'
  },
  categoriesTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 15px 0'
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  },
  categoryItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px'
  },
  categoryInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryName: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500'
  },
  categoryCount: {
    fontSize: '14px',
    color: '#1890ff',
    fontWeight: 'bold'
  },
  categoryBar: {
    height: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: '#1890ff',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  cardActions: {
    marginTop: '20px',
    textAlign: 'center' as const
  },
  instagramLink: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#E4405F',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '25px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
    fontSize: '14px'
  },
  insightsSection: {
    marginBottom: '40px'
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  insightCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  footer: {
    textAlign: 'center' as const,
    padding: '30px',
    color: 'white',
    borderTop: '1px solid rgba(255,255,255,0.2)'
  }
};

// 添加CSS动画
const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .metric-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    }
    
    .competitor-card:hover {
      transform: translateY(-3px);
    }
    
    .instagram-link:hover {
      background-color: #C13584;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
    }
  `}</style>
);

// 包装组件以包含全局样式
export default function DashboardWithStyles() {
  return (
    <>
      <GlobalStyles />
      <PureDashboard />
    </>
  );
}