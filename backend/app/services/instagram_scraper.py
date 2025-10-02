import instaloader
import requests
import time
import logging
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import re
from urllib.parse import urlparse

from app.models.instagram import InstagramAccount, InstagramPost, InstagramComment

logger = logging.getLogger(__name__)

class InstagramScraperService:
    def __init__(self, db: Session):
        self.db = db
        self.loader = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=True,
            save_metadata=True,
            compress_json=False,
            post_metadata_txt_pattern=''
        )
        self.session = requests.Session()
        
        # 目标竞争对手列表
        self.target_competitors = [
            "51talkksa",
            "novakid_mena", 
            "vipkid_ar"
        ]
        
        # 目标标签
        self.target_hashtags = [
            "تعليم_انجليزي_للاطفال",
            "لغة_انجليزية", 
            "KSA_K12",
            "تعليم_اونلاين",
            "تعليم_الاطفال",
            "الرياض_تعليم",
            "جدة_تعليم",
            "الدمام_تعليم"
        ]
    
    def login(self, username: str, password: str) -> bool:
        """登录Instagram账户"""
        try:
            self.loader.login(username, password)
            logger.info(f"成功登录Instagram账户: {username}")
            return True
        except Exception as e:
            logger.error(f"Instagram登录失败: {e}")
            return False
    
    def scrape_accounts(self, usernames: List[str], max_posts: int = 50, include_comments: bool = True):
        """抓取多个账户的数据"""
        results = []
        
        for username in usernames:
            try:
                logger.info(f"开始抓取账户: {username}")
                account_data = self.scrape_account(username, max_posts, include_comments)
                results.append(account_data)
                
                # 添加延迟避免被限制
                time.sleep(5)
                
            except Exception as e:
                logger.error(f"抓取账户 {username} 失败: {e}")
                continue
        
        return results
    
    def scrape_account(self, username: str, max_posts: int = 50, include_comments: bool = True) -> Dict:
        """抓取单个账户的数据"""
        try:
            # 获取账户信息
            profile = instaloader.Profile.from_username(self.loader.context, username)
            
            # 保存或更新账户信息
            account = self.save_account_info(profile)
            
            # 获取帖子
            posts_data = []
            posts_count = 0
            
            for post in profile.get_posts():
                if posts_count >= max_posts:
                    break
                
                try:
                    # 保存帖子信息
                    post_data = self.save_post_info(post, account.id)
                    
                    # 如果需要，获取评论
                    if include_comments:
                        comments = self.scrape_post_comments(post, post_data.id)
                        post_data.comments_count = len(comments)
                    
                    # 计算互动率
                    engagement_rate = self.calculate_engagement_rate(post_data, account)
                    post_data.engagement_rate = engagement_rate
                    
                    posts_data.append(post_data)
                    posts_count += 1
                    
                    # 添加延迟
                    time.sleep(2)
                    
                except Exception as e:
                    logger.error(f"处理帖子失败: {e}")
                    continue
            
            # 提交数据库更改
            self.db.commit()
            
            logger.info(f"成功抓取账户 {username}: {posts_count} 帖子")
            
            return {
                "account": account,
                "posts": posts_data,
                "total_posts": posts_count
            }
            
        except Exception as e:
            logger.error(f"抓取账户 {username} 时出错: {e}")
            self.db.rollback()
            raise e
    
    def save_account_info(self, profile) -> InstagramAccount:
        """保存账户信息到数据库"""
        # 检查账户是否已存在
        existing_account = self.db.query(InstagramAccount).filter(
            InstagramAccount.username == profile.username
        ).first()
        
        if existing_account:
            # 更新现有账户信息
            existing_account.full_name = profile.full_name
            existing_account.biography = profile.biography
            existing_account.followers_count = profile.followers
            existing_account.following_count = profile.followees
            existing_account.posts_count = profile.mediacount
            existing_account.is_verified = profile.is_verified
            existing_account.is_business = profile.is_business_account
            existing_account.profile_pic_url = profile.profile_pic_url
            existing_account.external_url = profile.external_url
            account = existing_account
        else:
            # 创建新账户记录
            account = InstagramAccount(
                username=profile.username,
                full_name=profile.full_name,
                biography=profile.biography,
                followers_count=profile.followers,
                following_count=profile.followees,
                posts_count=profile.mediacount,
                is_verified=profile.is_verified,
                is_business=profile.is_business_account,
                profile_pic_url=profile.profile_pic_url,
                external_url=profile.external_url
            )
            self.db.add(account)
        
        return account
    
    def save_post_info(self, post, account_id: int) -> InstagramPost:
        """保存帖子信息到数据库"""
        # 检查帖子是否已存在
        existing_post = self.db.query(InstagramPost).filter(
            InstagramPost.post_id == str(post.mediaid)
        ).first()
        
        # 提取hashtags和mentions
        caption_hashtags = self.extract_hashtags(post.caption) if post.caption else []
        caption_mentions = self.extract_mentions(post.caption) if post.caption else []
        
        # 判断媒体类型
        media_type = self.determine_media_type(post)
        
        # 获取媒体URL
        media_url = post.url if hasattr(post, 'url') else None
        thumbnail_url = post.thumbnail_url if hasattr(post, 'thumbnail_url') else None
        
        if existing_post:
            # 更新现有帖子
            existing_post.caption = post.caption
            existing_post.caption_hashtags = caption_hashtags
            existing_post.caption_mentions = caption_mentions
            existing_post.media_type = media_type
            existing_post.media_url = media_url
            existing_post.thumbnail_url = thumbnail_url
            existing_post.likes_count = post.likes
            existing_post.comments_count = post.comments
            existing_post.posted_at = post.date
            existing_post.location_name = post.location.name if post.location else None
            post_obj = existing_post
        else:
            # 创建新帖子记录
            post_obj = InstagramPost(
                post_id=str(post.mediaid),
                account_id=account_id,
                shortcode=post.shortcode,
                caption=post.caption,
                caption_hashtags=caption_hashtags,
                caption_mentions=caption_mentions,
                media_type=media_type,
                media_url=media_url,
                thumbnail_url=thumbnail_url,
                likes_count=post.likes,
                comments_count=post.comments,
                posted_at=post.date,
                location_name=post.location.name if post.location else None
            )
            self.db.add(post_obj)
        
        return post_obj
    
    def scrape_post_comments(self, post, post_db_id: int) -> List[InstagramComment]:
        """抓取帖子的评论"""
        comments = []
        
        try:
            for comment in post.get_comments():
                try:
                    # 保存评论信息
                    comment_obj = InstagramComment(
                        comment_id=str(comment.id),
                        post_id=post_db_id,
                        text=comment.text,
                        author_username=comment.owner.username,
                        author_full_name=comment.owner.full_name,
                        likes_count=comment.likes_count if hasattr(comment, 'likes_count') else 0,
                        commented_at=comment.created_at_utc,
                        parent_comment_id=str(comment.parent_comment_id) if hasattr(comment, 'parent_comment_id') and comment.parent_comment_id else None
                    )
                    self.db.add(comment_obj)
                    comments.append(comment_obj)
                    
                except Exception as e:
                    logger.error(f"处理评论失败: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"获取评论失败: {e}")
        
        return comments
    
    def extract_hashtags(self, text: str) -> List[str]:
        """从文本中提取hashtags"""
        if not text:
            return []
        
        # 匹配阿拉伯语和英语的hashtags
        hashtags = re.findall(r'#\w+', text)
        return hashtags
    
    def extract_mentions(self, text: str) -> List[str]:
        """从文本中提取mentions"""
        if not text:
            return []
        
        # 匹配阿拉伯语和英语的mentions
        mentions = re.findall(r'@\w+', text)
        return mentions
    
    def determine_media_type(self, post) -> str:
        """判断媒体类型"""
        if post.typename == "GraphImage":
            return "image"
        elif post.typename == "GraphVideo":
            return "video"
        elif post.typename == "GraphSidecar":
            return "carousel"
        else:
            return "unknown"
    
    def calculate_engagement_rate(self, post: InstagramPost, account: InstagramAccount) -> float:
        """计算互动率"""
        if account.followers_count == 0:
            return 0.0
        
        # 互动率 = (点赞数 + 评论数) / 粉丝数 * 100
        engagement = (post.likes_count + post.comments_count) / account.followers_count * 100
        return round(engagement, 4)
    
    def search_by_hashtags(self, hashtags: List[str], max_posts_per_tag: int = 30) -> Dict:
        """通过hashtag搜索相关帖子"""
        results = {}
        
        for hashtag in hashtags:
            try:
                logger.info(f"搜索hashtag: #{hashtag}")
                posts_data = []
                
                # 使用instaloader搜索hashtag
                hashtag_obj = instaloader.Hashtag.from_name(self.loader.context, hashtag)
                
                count = 0
                for post in hashtag_obj.get_posts():
                    if count >= max_posts_per_tag:
                        break
                    
                    try:
                        # 获取帖子基本信息
                        post_info = {
                            "shortcode": post.shortcode,
                            "caption": post.caption,
                            "likes_count": post.likes,
                            "comments_count": post.comments,
                            "posted_at": post.date,
                            "owner_username": post.owner_username,
                            "hashtags": self.extract_hashtags(post.caption) if post.caption else []
                        }
                        posts_data.append(post_info)
                        count += 1
                        
                        time.sleep(1)
                        
                    except Exception as e:
                        logger.error(f"处理hashtag帖子失败: {e}")
                        continue
                
                results[hashtag] = {
                    "total_found": len(posts_data),
                    "posts": posts_data
                }
                
                # 添加延迟避免被限制
                time.sleep(5)
                
            except Exception as e:
                logger.error(f"搜索hashtag #{hashtag} 失败: {e}")
                results[hashtag] = {"error": str(e)}
                continue
        
        return results
    
    def get_trending_content(self, competitor_usernames: List[str], days_back: int = 7) -> Dict:
        """获取竞品的趋势内容"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        trending_content = {
            "period": f"{days_back} days",
            "competitors": {},
            "top_performing_posts": []
        }
        
        all_posts = []
        
        for username in competitor_usernames:
            try:
                # 获取账户信息
                account = self.db.query(InstagramAccount).filter(
                    InstagramAccount.username == username
                ).first()
                
                if not account:
                    continue
                
                # 获取最近帖子
                posts = self.db.query(InstagramPost).filter(
                    InstagramPost.account_id == account.id,
                    InstagramPost.posted_at >= start_date,
                    InstagramPost.posted_at <= end_date
                ).order_by(InstagramPost.engagement_rate.desc()).all()
                
                competitor_data = {
                    "total_posts": len(posts),
                    "avg_engagement_rate": sum(post.engagement_rate for post in posts) / len(posts) if posts else 0,
                    "top_posts": []
                }
                
                # 获取表现最好的帖子
                top_posts = posts[:5]  # 前5个帖子
                for post in top_posts:
                    post_data = {
                        "post_id": post.post_id,
                        "shortcode": post.shortcode,
                        "caption": post.caption[:200] + "..." if post.caption and len(post.caption) > 200 else post.caption,
                        "engagement_rate": post.engagement_rate,
                        "likes_count": post.likes_count,
                        "comments_count": post.comments_count,
                        "content_category": post.content_category,
                        "posted_at": post.posted_at
                    }
                    competitor_data["top_posts"].append(post_data)
                    all_posts.append({
                        "competitor": username,
                        "post_data": post_data
                    })
                
                trending_content["competitors"][username] = competitor_data
                
            except Exception as e:
                logger.error(f"分析竞品 {username} 趋势失败: {e}")
                continue
        
        # 所有竞品中表现最好的帖子
        all_posts.sort(key=lambda x: x["post_data"]["engagement_rate"], reverse=True)
        trending_content["top_performing_posts"] = all_posts[:10]  # 前10个帖子
        
        return trending_content