from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class ContentAnalysis(BaseModel):
    __tablename__ = "content_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("instagram_posts.id"), unique=True, nullable=False)
    
    # 内容分类
    content_category = Column(String(50), nullable=False)  # 互动游戏/竞赛, 促销/销售, 纯教育内容, 品牌/社区, 其他
    category_confidence = Column(Float, default=0.0)
    
    # 情感分析
    sentiment_score = Column(Float, default=0.0)  # -1到1
    sentiment_label = Column(String(20))  # positive, negative, neutral
    confidence = Column(Float, default=0.0)
    
    # 关键词提取
    keywords = Column(JSON)  # 关键词列表
    topics = Column(JSON)     # 主题列表
    
    # 内容质量评分
    content_quality_score = Column(Float, default=0.0)  # 0-100
    engagement_prediction = Column(Float, default=0.0)  # 预测的互动率
    
    # 竞品对比分析
    competitor_comparison = Column(JSON)  # 与竞品的对比数据
    market_position = Column(String(50))  # 市场定位
    
    # 关系
    post = relationship("InstagramPost", back_populates="analysis")

class TrendAnalysis(BaseModel):
    __tablename__ = "trend_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 分析时间范围
    analysis_date = Column(DateTime(timezone=True))
    analysis_period = Column(String(20))  # daily, weekly, monthly
    
    # 账户范围
    account_usernames = Column(JSON)  # 分析的账户列表
    
    # 趋势数据
    trending_hashtags = Column(JSON)  # 热门标签
    trending_topics = Column(JSON)     # 热门话题
    content_categories_performance = Column(JSON)  # 各内容类型表现
    
    # 互动趋势
    engagement_trends = Column(JSON)  # 互动率趋势
    follower_growth_trends = Column(JSON)  # 粉丝增长趋势
    
    # 市场洞察
    market_insights = Column(Text)
    competitive_landscape = Column(JSON)  # 竞争格局分析
    
    # 推荐策略
    recommended_strategies = Column(JSON)  # 推荐的营销策略
    optimal_posting_times = Column(JSON)   # 最佳发布时间

class CompetitorBenchmark(BaseModel):
    __tablename__ = "competitor_benchmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 基准测试信息
    benchmark_name = Column(String(100))
    analysis_period = Column(String(20))
    
    # 竞争对手数据
    competitor_data = Column(JSON)  # 各竞品的综合数据
    
    # 性能指标
    avg_engagement_rate = Column(Float)
    avg_follower_growth = Column(Float)
    content_frequency = Column(JSON)
    
    # 优势劣势分析
    strengths = Column(JSON)
    weaknesses = Column(JSON)
    opportunities = Column(JSON)
    threats = Column(JSON)
    
    # 建议
    recommendations = Column(JSON)