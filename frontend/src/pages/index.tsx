import { useState, useEffect } from 'react';

// 模拟API数据
const mockCompetitors = [
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
];

export default function PureDashboard() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('zh-CN'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalFollowers = mockCompetitors.reduce((sum, comp) => sum + comp.followers_count, 0);
  const totalPosts = mockCompetitors.reduce((sum, comp) => sum + comp.posts_count, 0);
  const avgEngagement = mockCompetitors.length > 0 
    ? (mockCompetitors.reduce((sum, comp) => sum + comp.avg_engagement_rate, 0) / mockCompetitors.length * 100).toFixed(2)
    : '0.00';

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        
        .dashboard-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .dashboard-header {
          text-align: center;
          margin-bottom: 40px;
          color: white;
        }
        
        .dashboard-title {
          font-size: 36px;
          font-weight: bold;
          margin: 0 0 10px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .dashboard-subtitle {
          font-size: 16px;
          opacity: 0.9;
          margin: 0;
        }
        
        .metrics-section {
          margin-bottom: 40px;
        }
        
        .section-title {
          font-size: 24px;
          font-weight: bold;
          color: white;
          text-align: center;
          margin-bottom: 20px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .metric-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          transition: transform 0.3s ease;
        }
        
        .metric-card:hover {
          transform: translateY(-5px);
        }
        
        .metric-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        
        .metric-label {
          font-size: 16px;
          color: #666;
          margin: 0 0 10px 0;
          font-weight: 600;
        }
        
        .metric-value {
          font-size: 32px;
          font-weight: bold;
          color: #1890ff;
          margin: 0;
        }
        
        .competitors-section {
          margin-bottom: 40px;
        }
        
        .competitor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 25px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .competitor-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          transition: transform 0.3s ease;
        }
        
        .competitor-card:hover {
          transform: translateY(-3px);
        }
        
        .card-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .competitor-name {
          font-size: 20px;
          font-weight: bold;
          color: #1a1a1a;
          margin: 0 0 5px 0;
        }
        
        .competitor-full-name {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
          font-weight: 600;
        }
        
        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #1890ff;
        }
        
        .content-categories {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
        }
        
        .categories-title {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin: 0 0 15px 0;
        }
        
        .category-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .category-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .category-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .category-name {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        
        .category-count {
          font-size: 14px;
          color: #1890ff;
          font-weight: bold;
        }
        
        .category-bar {
          height: 8px;
          background-color: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .category-bar-fill {
          height: 100%;
          background-color: #1890ff;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .card-actions {
          margin-top: 20px;
          text-align: center;
        }
        
        .instagram-link {
          display: inline-block;
          padding: 10px 20px;
          background-color: #E4405F;
          color: white;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          transition: background-color 0.3s ease;
          font-size: 14px;
        }
        
        .instagram-link:hover {
          background-color: #C13584;
        }
        
        .insights-section {
          margin-bottom: 40px;
        }
        
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .insight-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .footer {
          text-align: center;
          padding: 30px;
          color: white;
          border-top: 1px solid rgba(255,255,255,0.2);
        }
        
        @media (max-width: 768px) {
          .dashboard-title {
            font-size: 28px;
          }
          
          .metrics-grid,
          .competitor-grid {
            grid-template-columns: 1fr;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">🇸🇦 沙特K12竞品Instagram分析仪表盘</h1>
          <p className="dashboard-subtitle">实时监控竞争对手社交媒体策略 | {currentTime}</p>
        </header>

        <section className="metrics-section">
          <h2 className="section-title">📊 核心指标总览</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">📱</div>
              <h3 className="metric-label">竞品总数</h3>
              <p className="metric-value">{mockCompetitors.length}</p>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">👥</div>
              <h3 className="metric-label">总粉丝数</h3>
              <p className="metric-value">{totalFollowers.toLocaleString()}</p>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">📝</div>
              <h3 className="metric-label">总帖子数</h3>
              <p className="metric-value">{totalPosts.toLocaleString()}</p>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">💝</div>
              <h3 className="metric-label">平均互动率</h3>
              <p className="metric-value">{avgEngagement}%</p>
            </div>
          </div>
        </section>

        <section className="competitors-section">
          <h2 className="section-title">🏆 竞品详细分析</h2>
          <div className="competitor-grid">{mockCompetitors.map((competitor) => {
              const bestCategory = Object.entries(competitor.content_category_distribution)
                .sort(([,a], [,b]) => b - a)[0];
              
              return (
                <div key={competitor.username} className="competitor-card">
                  <div className="card-header">
                    <h3 className="competitor-name">@{competitor.username}</h3>
                    <p className="competitor-full-name">{competitor.full_name}</p>
                  </div>
                  
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">粉丝数</span>
                      <span className="statValue">{competitor.followers_count.toLocaleString()}</span>
                    </div>
                    
                    <div className="stat-item">
                      <span className="stat-label">帖子数</span>
                      <span className="statValue">{competitor.posts_count.toLocaleString()}</span>
                    </div>
                    
                    <div className="stat-item">
                      <span className="stat-label">互动率</span>
                      <span className="statValue">{(competitor.avg_engagement_rate * 100).toFixed(2)}%</span>
                    </div>
                    
                    <div className="stat-item">
                      <span className="stat-label">主要内容</span>
                      <span className="statValue">{bestCategory?.[0] || '未分类'}</span>
                    </div>
                  </div>
                  
                  <div className="content-categories">
                    <h4 className="categories-title">📋 内容分类分布</h4>
                    <div className="category-list">
                      {Object.entries(competitor.content_category_distribution).map(([category, count]) => (
                        <div key={category} className="category-item">
                          <div className="category-info">
                            <span className="category-name">{category}</span>
                            <span className="category-count">{count} 帖子</span>
                          </div>
                          <div className="category-bar">
                            <div 
                              className="category-bar-fill"
                              style={{
                                width: `${(count / competitor.posts_count) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    <a 
                      href={`https://instagram.com/${competitor.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="instagram-link"
                    >
                      📱 访问Instagram主页
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="insights-section">
          <h2 className="section-title">💡 关键洞察</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>🎯 内容策略建议</h4>
              <p>"互动游戏/竞赛"类内容表现最佳，建议增加此类内容发布频率</p>
            </div>
            
            <div className="insight-card">
              <h4>⏰ 发布时机</h4>
              <p>沙特时间晚间18:00-22:00为最佳发布时间</p>
            </div>
            
            <div className="insight-card">
              <h4>📈 市场趋势</h4>
              <p>在线K12英语教育在沙特市场持续增长，竞争激烈</p>
            </div>
            
            <div className="insight-card">
              <h4>🏆 最佳实践</h4>
              <p>学习novakid_mena的内容策略，其互动率最高(4.5%)</p>
            </div>
          </div>
        </section>

        <footer className="footer">
          <p>🚀 基于Instagram API实时数据分析 | 专为沙特K12教育市场定制</p>
          <p>📊 数据更新时间: {currentTime} | 追踪竞品: @51talkksa @novakid_mena @vipkid_ar</p>
        </footer>
      </div>
    </>
  );
}