from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.database import get_db
from app.models.analysis import ContentAnalysis, TrendAnalysis, CompetitorBenchmark
from app.models.instagram import InstagramPost, InstagramAccount
from app.services.analysis_service import AnalysisService

router = APIRouter()

# Pydantic模型
class AnalysisResponse(BaseModel):
    id: int
    content_category: str
    category_confidence: float
    sentiment_score: float
    sentiment_label: str
    content_quality_score: float
    engagement_prediction: float
    
    class Config:
        from_attributes = True

class TrendResponse(BaseModel):
    id: int
    analysis_date: datetime
    analysis_period: str
    trending_hashtags: Optional[dict]
    trending_topics: Optional[dict]
    engagement_trends: Optional[dict]
    market_insights: Optional[str]
    
    class Config:
        from_attributes = True

@router.get("/content/{post_id}", response_model=AnalysisResponse)
def get_content_analysis(post_id: str, db: Session = Depends(get_db)):
    """获取特定帖子的内容分析"""
    post = db.query(InstagramPost).filter(InstagramPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子未找到")
    
    analysis = db.query(ContentAnalysis).filter(ContentAnalysis.post_id == post.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="分析数据未找到")
    
    return analysis

@router.post("/content/analyze/{post_id}")
def analyze_content(post_id: str, db: Session = Depends(get_db)):
    """对特定帖子进行内容分析"""
    post = db.query(InstagramPost).filter(InstagramPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子未找到")
    
    analysis_service = AnalysisService(db)
    analysis = analysis_service.analyze_content(post)
    
    return analysis

@router.get("/content/category-distribution")
def get_category_distribution(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    account_username: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """获取内容分类分布统计"""
    query = db.query(InstagramPost)
    
    if start_date:
        query = query.filter(InstagramPost.posted_at >= start_date)
    if end_date:
        query = query.filter(InstagramPost.posted_at <= end_date)
    if account_username:
        query = query.join(InstagramAccount).filter(InstagramAccount.username == account_username)
    
    posts = query.all()
    
    # 统计分类分布
    category_distribution = {}
    for post in posts:
        if post.content_category:
            category_distribution[post.content_category] = category_distribution.get(post.content_category, 0) + 1
    
    return {
        "total_posts": len(posts),
        "category_distribution": category_distribution,
        "time_range": {
            "start": start_date.isoformat() if start_date else None,
            "end": end_date.isoformat() if end_date else None
        }
    }

@router.get("/sentiment/overview")
def get_sentiment_overview(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """获取情感分析概览"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # 获取最近30天的分析数据
    analyses = db.query(ContentAnalysis).join(InstagramPost).filter(
        InstagramPost.posted_at >= start_date,
        InstagramPost.posted_at <= end_date
    ).all()
    
    if not analyses:
        return {"message": "没有找到分析数据"}
    
    # 统计情感分布
    sentiment_distribution = {"positive": 0, "negative": 0, "neutral": 0}
    total_sentiment_score = 0
    
    for analysis in analyses:
        sentiment_distribution[analysis.sentiment_label] += 1
        total_sentiment_score += analysis.sentiment_score
    
    avg_sentiment_score = total_sentiment_score / len(analyses) if analyses else 0
    
    return {
        "period_days": days,
        "total_analyses": len(analyses),
        "sentiment_distribution": sentiment_distribution,
        "average_sentiment_score": avg_sentiment_score,
        "overall_sentiment": "positive" if avg_sentiment_score > 0.1 else "negative" if avg_sentiment_score < -0.1 else "neutral"
    }

@router.get("/trends/latest", response_model=TrendResponse)
def get_latest_trends(db: Session = Depends(get_db)):
    """获取最新的趋势分析"""
    latest_trend = db.query(TrendAnalysis).order_by(TrendAnalysis.analysis_date.desc()).first()
    if not latest_trend:
        raise HTTPException(status_code=404, detail="趋势分析数据未找到")
    
    return latest_trend

@router.post("/trends/generate")
def generate_trend_analysis(
    analysis_period: str = "weekly",
    db: Session = Depends(get_db)
):
    """生成新的趋势分析"""
    analysis_service = AnalysisService(db)
    trend_analysis = analysis_service.generate_trend_analysis(analysis_period)
    
    return trend_analysis

@router.get("/competitors/benchmark")
def get_competitor_benchmark(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """获取竞争对手基准测试"""
    target_competitors = ["51talkksa", "novakid_mena", "vipkid_ar"]
    
    analysis_service = AnalysisService(db)
    benchmark = analysis_service.generate_competitor_benchmark(target_competitors, days)
    
    return benchmark

@router.get("/performance/engagement")
def get_engagement_performance(
    account_username: Optional[str] = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """获取互动表现分析"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    query = db.query(InstagramPost).filter(
        InstagramPost.posted_at >= start_date,
        InstagramPost.posted_at <= end_date
    )
    
    if account_username:
        query = query.join(InstagramAccount).filter(InstagramAccount.username == account_username)
    
    posts = query.all()
    
    if not posts:
        return {"message": "没有找到帖子数据"}
    
    # 计算互动指标
    total_engagement = sum(post.engagement_rate for post in posts)
    avg_engagement = total_engagement / len(posts) if posts else 0
    
    # 按内容分类统计互动率
    category_engagement = {}
    for post in posts:
        if post.content_category:
            if post.content_category not in category_engagement:
                category_engagement[post.content_category] = []
            category_engagement[post.content_category].append(post.engagement_rate)
    
    # 计算各分类平均互动率
    avg_category_engagement = {
        category: sum(rates) / len(rates) 
        for category, rates in category_engagement.items()
    }
    
    return {
        "period_days": days,
        "total_posts": len(posts),
        "average_engagement_rate": avg_engagement,
        "engagement_by_category": avg_category_engagement,
        "best_performing_category": max(avg_category_engagement.items(), key=lambda x: x[1])[0] if avg_category_engagement else None
    }