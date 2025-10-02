from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.instagram import InstagramAccount, InstagramPost, InstagramComment
from app.services.instagram_scraper import InstagramScraperService

router = APIRouter()

# Pydantic模型
class AccountResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    followers_count: int
    posts_count: int
    is_verified: bool
    profile_pic_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: int
    post_id: str
    shortcode: str
    caption: Optional[str]
    media_type: Optional[str]
    likes_count: int
    comments_count: int
    posted_at: Optional[datetime]
    engagement_rate: float
    content_category: Optional[str]
    sentiment_score: float
    
    class Config:
        from_attributes = True

class ScrapingRequest(BaseModel):
    usernames: List[str]
    max_posts: int = 50
    include_comments: bool = True

@router.get("/accounts", response_model=List[AccountResponse])
def get_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取所有Instagram账户列表"""
    accounts = db.query(InstagramAccount).offset(skip).limit(limit).all()
    return accounts

@router.get("/accounts/{username}", response_model=AccountResponse)
def get_account(username: str, db: Session = Depends(get_db)):
    """获取特定Instagram账户信息"""
    account = db.query(InstagramAccount).filter(InstagramAccount.username == username).first()
    if not account:
        raise HTTPException(status_code=404, detail="账户未找到")
    return account

@router.post("/scrape-accounts")
def scrape_accounts(request: ScrapingRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """抓取Instagram账户数据"""
    scraper_service = InstagramScraperService(db)
    
    # 在后台任务中执行抓取
    background_tasks.add_task(
        scraper_service.scrape_accounts,
        request.usernames,
        request.max_posts,
        request.include_comments
    )
    
    return {"message": "抓取任务已添加到后台队列", "usernames": request.usernames}

@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    skip: int = 0, 
    limit: int = 100, 
    account_username: Optional[str] = None,
    content_category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """获取帖子列表，支持筛选"""
    query = db.query(InstagramPost)
    
    if account_username:
        query = query.join(InstagramAccount).filter(InstagramAccount.username == account_username)
    
    if content_category:
        query = query.filter(InstagramPost.content_category == content_category)
    
    posts = query.order_by(InstagramPost.posted_at.desc()).offset(skip).limit(limit).all()
    return posts

@router.get("/posts/{post_id}")
def get_post(post_id: str, db: Session = Depends(get_db)):
    """获取特定帖子详情"""
    post = db.query(InstagramPost).filter(InstagramPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子未找到")
    
    # 获取相关评论
    comments = db.query(InstagramComment).filter(InstagramComment.post_id == post.id).all()
    
    return {
        "post": post,
        "comments": comments,
        "comment_count": len(comments)
    }

@router.get("/competitors")
def get_competitor_analysis(db: Session = Depends(get_db)):
    """获取竞争对手分析数据"""
    target_competitors = ["51talkksa", "novakid_mena", "vipkid_ar"]
    
    analysis = []
    for username in target_competitors:
        account = db.query(InstagramAccount).filter(InstagramAccount.username == username).first()
        if account:
            posts = db.query(InstagramPost).filter(InstagramPost.account_id == account.id).all()
            
            # 计算统计数据
            total_posts = len(posts)
            avg_engagement = sum(post.engagement_rate for post in posts) / total_posts if total_posts > 0 else 0
            
            # 内容分类统计
            category_stats = {}
            for post in posts:
                if post.content_category:
                    category_stats[post.content_category] = category_stats.get(post.content_category, 0) + 1
            
            analysis.append({
                "username": username,
                "followers_count": account.followers_count,
                "total_posts": total_posts,
                "avg_engagement_rate": avg_engagement,
                "content_category_distribution": category_stats,
                "last_updated": account.updated_at
            })
    
    return analysis