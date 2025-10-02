from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import BaseModel

class InstagramAccount(BaseModel):
    __tablename__ = "instagram_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(200))
    biography = Column(Text)
    followers_count = Column(BigInteger, default=0)
    following_count = Column(BigInteger, default=0)
    posts_count = Column(BigInteger, default=0)
    is_verified = Column(Boolean, default=False)
    is_business = Column(Boolean, default=False)
    profile_pic_url = Column(String(500))
    external_url = Column(String(500))
    
    # 关系
    posts = relationship("InstagramPost", back_populates="account", cascade="all, delete-orphan")

class InstagramPost(BaseModel):
    __tablename__ = "instagram_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(String(100), unique=True, index=True, nullable=False)
    account_id = Column(Integer, ForeignKey("instagram_accounts.id"), nullable=False)
    shortcode = Column(String(50), unique=True, index=True)
    
    # 内容信息
    caption = Column(Text)
    caption_hashtags = Column(JSON)  # 存储hashtag数组
    caption_mentions = Column(JSON)   # 存储mention数组
    
    # 媒体信息
    media_type = Column(String(20))  # image, video, carousel
    media_url = Column(String(500))
    thumbnail_url = Column(String(500))
    
    # 互动数据
    likes_count = Column(BigInteger, default=0)
    comments_count = Column(BigInteger, default=0)
    shares_count = Column(BigInteger, default=0)
    saves_count = Column(BigInteger, default=0)
    
    # 时间和位置
    posted_at = Column(DateTime(timezone=True))
    location_name = Column(String(200))
    location_id = Column(String(100))
    
    # 分析字段
    engagement_rate = Column(Float, default=0.0)
    content_category = Column(String(50))  # 互动游戏/竞赛, 促销/销售, 纯教育内容, 品牌/社区, 其他
    sentiment_score = Column(Float, default=0.0)  # -1到1的情感分数
    
    # 关系
    account = relationship("InstagramAccount", back_populates="posts")
    comments = relationship("InstagramComment", back_populates="post", cascade="all, delete-orphan")
    analysis = relationship("ContentAnalysis", back_populates="post", uselist=False, cascade="all, delete-orphan")

class InstagramComment(BaseModel):
    __tablename__ = "instagram_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(String(100), unique=True, index=True, nullable=False)
    post_id = Column(Integer, ForeignKey("instagram_posts.id"), nullable=False)
    
    # 评论信息
    text = Column(Text)
    author_username = Column(String(100))
    author_full_name = Column(String(200))
    
    # 互动数据
    likes_count = Column(BigInteger, default=0)
    
    # 时间和回复
    commented_at = Column(DateTime(timezone=True))
    parent_comment_id = Column(String(100))  # 如果是回复，存储父评论ID
    
    # 分析字段
    sentiment_score = Column(Float, default=0.0)
    is_relevant = Column(Boolean, default=True)  # 是否与主题相关
    
    # 关系
    post = relationship("InstagramPost", back_populates="comments")