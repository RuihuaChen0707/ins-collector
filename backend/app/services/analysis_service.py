from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import logging
import re
from transformers import pipeline
import torch

from app.models.instagram import InstagramPost, InstagramComment, InstagramAccount
from app.models.analysis import ContentAnalysis, TrendAnalysis, CompetitorBenchmark

logger = logging.getLogger(__name__)

class AnalysisService:
    def __init__(self, db: Session):
        self.db = db
        
        # 初始化情感分析模型
        try:
            # 使用多语言情感分析模型，支持阿拉伯语
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-xlm-roberta-base-sentiment",
                tokenizer="cardiffnlp/twitter-xlm-roberta-base-sentiment"
            )
            logger.info("情感分析模型加载成功")
        except Exception as e:
            logger.error(f"加载情感分析模型失败: {e}")
            self.sentiment_analyzer = None
        
        # 内容分类关键词定义（阿拉伯语和英语）
        self.content_categories = {
            "互动游戏/竞赛": {
                "ar": ["مسابقة", "لعبة", "تحدي", "جائزة", "فوز", "ربح", "مشاركة"],
                "en": ["contest", "game", "challenge", "prize", "win", "competition", "participate"]
            },
            "促销/销售": {
                "ar": ["خصم", "عرض", "تخفيض", "سعر", "شراء", "بيع", "تسويق", "إعلان"],
                "en": ["discount", "offer", "sale", "price", "buy", "purchase", "promotion", "deal"]
            },
            "纯教育内容": {
                "ar": ["تعليم", "تعلم", "درس", "معلومة", "تربية", "تطوير", "مهارة", "معرفة"],
                "en": ["education", "learning", "lesson", "information", "teaching", "development", "skill", "knowledge"]
            },
            "品牌/社区": {
                "ar": ["مجتمع", "أسرة", "تواصل", "علاقة", "دعم", "مبادرة", "فعالية"],
                "en": ["community", "family", "connection", "relationship", "support", "initiative", "event"]
            }
        }
    
    def analyze_content(self, post: InstagramPost) -> ContentAnalysis:
        """分析单个帖子的内容"""
        try:
            # 检查是否已有分析结果
            existing_analysis = self.db.query(ContentAnalysis).filter(
                ContentAnalysis.post_id == post.id
            ).first()
            
            if existing_analysis:
                return existing_analysis
            
            # 内容分类
            content_category, category_confidence = self.classify_content(post.caption)
            
            # 情感分析
            sentiment_score, sentiment_label, confidence = self.analyze_sentiment(post.caption)
            
            # 关键词提取
            keywords = self.extract_keywords(post.caption)
            topics = self.extract_topics(post.caption)
            
            # 内容质量评分
            content_quality_score = self.calculate_content_quality(post)
            
            # 互动预测
            engagement_prediction = self.predict_engagement(post)
            
            # 创建分析记录
            analysis = ContentAnalysis(
                post_id=post.id,
                content_category=content_category,
                category_confidence=category_confidence,
                sentiment_score=sentiment_score,
                sentiment_label=sentiment_label,
                confidence=confidence,
                keywords=keywords,
                topics=topics,
                content_quality_score=content_quality_score,
                engagement_prediction=engagement_prediction
            )
            
            self.db.add(analysis)
            self.db.commit()
            
            # 更新帖子的分析字段
            post.content_category = content_category
            post.sentiment_score = sentiment_score
            self.db.commit()
            
            logger.info(f"内容分析完成 - 帖子ID: {post.post_id}, 分类: {content_category}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"内容分析失败 - 帖子ID: {post.post_id}, 错误: {e}")
            self.db.rollback()
            raise e
    
    def classify_content(self, text: Optional[str]) -> tuple[str, float]:
        """内容分类"""
        if not text:
            return "其他", 0.0
        
        text_lower = text.lower()
        category_scores = {}
        
        # 为每个分类计算分数
        for category, keywords in self.content_categories.items():
            score = 0
            total_keywords = 0
            
            # 检查阿拉伯语关键词
            for keyword in keywords["ar"]:
                if keyword.lower() in text_lower:
                    score += 1
                total_keywords += 1
            
            # 检查英语关键词
            for keyword in keywords["en"]:
                if keyword.lower() in text_lower:
                    score += 1
                total_keywords += 1
            
            # 计算置信度
            confidence = score / total_keywords if total_keywords > 0 else 0
            category_scores[category] = confidence
        
        # 选择分数最高的分类
        if category_scores:
            best_category = max(category_scores.items(), key=lambda x: x[1])
            if best_category[1] > 0.1:  # 最低置信度阈值
                return best_category[0], best_category[1]
        
        return "其他", 0.0
    
    def analyze_sentiment(self, text: Optional[str]) -> tuple[float, str, float]:
        """情感分析"""
        if not text or not self.sentiment_analyzer:
            return 0.0, "neutral", 0.0
        
        try:
            # 使用模型进行情感分析
            result = self.sentiment_analyzer(text[:512])[0]  # 限制文本长度
            
            label = result['label']
            confidence = result['score']
            
            # 将标签转换为情感分数
            if label == "positive":
                sentiment_score = confidence
            elif label == "negative":
                sentiment_score = -confidence
            else:  # neutral
                sentiment_score = 0.0
            
            return sentiment_score, label.lower(), confidence
            
        except Exception as e:
            logger.error(f"情感分析失败: {e}")
            return 0.0, "neutral", 0.0
    
    def extract_keywords(self, text: Optional[str]) -> List[str]:
        """关键词提取"""
        if not text:
            return []
        
        # 简单的关键词提取 - 基于频率和重要性
        words = re.findall(r'\b\w+\b', text.lower())
        
        # 过滤停用词（简单的阿拉伯语和英语停用词）
        stop_words = {
            "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
            "في", "من", "إلى", "على", "هذا", "هذه", "التي", "الذي", "و", "أو", "لكن"
        }
        
        # 计算词频
        word_freq = {}
        for word in words:
            if len(word) > 2 and word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # 返回频率最高的前10个词
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:10]]
    
    def extract_topics(self, text: Optional[str]) -> List[str]:
        """主题提取"""
        if not text:
            return []
        
        # 基于hashtag和关键词提取主题
        hashtags = re.findall(r'#\w+', text)
        mentions = re.findall(r'@\w+', text)
        
        topics = []
        topics.extend([tag[1:] for tag in hashtags])  # 移除#符号
        topics.extend([mention[1:] for mention in mentions])  # 移除@符号
        
        return topics[:10]  # 限制主题数量
    
    def calculate_content_quality(self, post: InstagramPost) -> float:
        """计算内容质量评分"""
        score = 0.0
        
        # 标题长度评分 (0-20分)
        if post.caption:
            caption_length = len(post.caption)
            if 100 <= caption_length <= 500:
                score += 20
            elif caption_length > 500:
                score += 15
            elif caption_length >= 50:
                score += 10
            else:
                score += 5
        
        # 媒体类型评分 (0-15分)
        if post.media_type == "carousel":
            score += 15  # 轮播图通常表现更好
        elif post.media_type == "video":
            score += 12
        elif post.media_type == "image":
            score += 10
        
        # Hashtag使用评分 (0-15分)
        if post.caption_hashtags:
            hashtag_count = len(post.caption_hashtags)
            if 5 <= hashtag_count <= 15:
                score += 15
            elif hashtag_count > 15:
                score += 10  # 过多的hashtag可能被视为垃圾信息
            elif hashtag_count >= 3:
                score += 10
            else:
                score += 5
        
        # 发布时间评分 (0-10分) - 基于沙特时区的最佳发布时间
        if post.posted_at:
            saudi_hour = (post.posted_at.hour + 3) % 24  # 转换为沙特时间
            if 18 <= saudi_hour <= 22:  # 晚上6-10点是最佳时间
                score += 10
            elif 12 <= saudi_hour <= 16:  # 下午也不错
                score += 8
            else:
                score += 5
        
        # 内容多样性评分 (0-10分)
        if post.caption_hashtags and len(post.caption_hashtags) > 3:
            score += 10
        
        # 基础分
        score += 30
        
        return min(score, 100)  # 确保不超过100分
    
    def predict_engagement(self, post: InstagramPost) -> float:
        """预测互动率"""
        # 基于历史数据和内容特征预测互动率
        # 这里使用简化的预测模型
        
        base_engagement = 0.02  # 基础互动率2%
        
        # 内容质量影响
        if hasattr(post, 'analysis') and post.analysis:
            quality_score = post.analysis.content_quality_score / 100
            base_engagement += quality_score * 0.03
        
        # 媒体类型影响
        if post.media_type == "carousel":
            base_engagement += 0.01
        elif post.media_type == "video":
            base_engagement += 0.008
        
        # Hashtag数量影响
        if post.caption_hashtags:
            hashtag_count = len(post.caption_hashtags)
            if 8 <= hashtag_count <= 12:
                base_engagement += 0.005
        
        # 情感影响
        if post.sentiment_score > 0.5:
            base_engagement += 0.005
        
        return min(base_engagement, 0.1)  # 限制最大预测互动率为10%
    
    def generate_trend_analysis(self, analysis_period: str = "weekly") -> TrendAnalysis:
        """生成趋势分析"""
        try:
            # 确定时间范围
            end_date = datetime.now()
            if analysis_period == "daily":
                start_date = end_date - timedelta(days=1)
            elif analysis_period == "weekly":
                start_date = end_date - timedelta(weeks=1)
            elif analysis_period == "monthly":
                start_date = end_date - timedelta(days=30)
            else:
                start_date = end_date - timedelta(weeks=1)
            
            # 获取目标竞争对手
            target_competitors = ["51talkksa", "novakid_mena", "vipkid_ar"]
            
            # 获取相关帖子
            posts = self.db.query(InstagramPost).join(InstagramAccount).filter(
                InstagramAccount.username.in_(target_competitors),
                InstagramPost.posted_at >= start_date,
                InstagramPost.posted_at <= end_date
            ).all()
            
            if not posts:
                logger.warning(f"在{analysis_period}期间没有找到帖子数据")
                return None
            
            # 分析热门hashtags
            hashtag_counter = {}
            for post in posts:
                if post.caption_hashtags:
                    for hashtag in post.caption_hashtags:
                        hashtag_counter[hashtag] = hashtag_counter.get(hashtag, 0) + 1
            
            trending_hashtags = dict(sorted(hashtag_counter.items(), key=lambda x: x[1], reverse=True)[:20])
            
            # 分析热门话题
            topic_counter = {}
            for post in posts:
                if hasattr(post, 'analysis') and post.analysis and post.analysis.topics:
                    for topic in post.analysis.topics:
                        topic_counter[topic] = topic_counter.get(topic, 0) + 1
            
            trending_topics = dict(sorted(topic_counter.items(), key=lambda x: x[1], reverse=True)[:15])
            
            # 内容分类表现分析
            category_performance = {}
            for post in posts:
                if post.content_category:
                    if post.content_category not in category_performance:
                        category_performance[post.content_category] = {
                            "count": 0,
                            "total_engagement": 0,
                            "avg_engagement": 0
                        }
                    
                    category_performance[post.content_category]["count"] += 1
                    category_performance[post.content_category]["total_engagement"] += post.engagement_rate
            
            # 计算平均互动率
            for category, stats in category_performance.items():
                if stats["count"] > 0:
                    stats["avg_engagement"] = stats["total_engagement"] / stats["count"]
            
            # 互动趋势
            engagement_trends = {}
            for i in range((end_date - start_date).days + 1):
                current_date = start_date + timedelta(days=i)
                day_posts = [post for post in posts if post.posted_at.date() == current_date.date()]
                
                if day_posts:
                    avg_engagement = sum(post.engagement_rate for post in day_posts) / len(day_posts)
                    engagement_trends[current_date.strftime("%Y-%m-%d")] = avg_engagement
            
            # 生成市场洞察
            market_insights = self.generate_market_insights(posts, category_performance, trending_hashtags)
            
            # 竞争格局分析
            competitive_landscape = self.analyze_competitive_landscape(posts, target_competitors)
            
            # 推荐策略
            recommended_strategies = self.generate_recommended_strategies(category_performance, trending_hashtags)
            
            # 最佳发布时间
            optimal_posting_times = self.analyze_optimal_posting_times(posts)
            
            # 创建趋势分析记录
            trend_analysis = TrendAnalysis(
                analysis_date=end_date,
                analysis_period=analysis_period,
                account_usernames=target_competitors,
                trending_hashtags=trending_hashtags,
                trending_topics=trending_topics,
                content_categories_performance=category_performance,
                engagement_trends=engagement_trends,
                market_insights=market_insights,
                competitive_landscape=competitive_landscape,
                recommended_strategies=recommended_strategies,
                optimal_posting_times=optimal_posting_times
            )
            
            self.db.add(trend_analysis)
            self.db.commit()
            
            logger.info(f"趋势分析生成完成 - 期间: {analysis_period}")
            
            return trend_analysis
            
        except Exception as e:
            logger.error(f"生成趋势分析失败: {e}")
            self.db.rollback()
            raise e
    
    def generate_market_insights(self, posts: List[InstagramPost], category_performance: Dict, trending_hashtags: Dict) -> str:
        """生成市场洞察"""
        insights = []
        
        # 内容类型洞察
        if category_performance:
            best_category = max(category_performance.items(), key=lambda x: x[1]["avg_engagement"])
            insights.append(f"表现最佳的内容类型是'{best_category[0]}'，平均互动率为{best_category[1]['avg_engagement']:.3f}%")
        
        # 热门标签洞察
        if trending_hashtags:
            top_hashtags = list(trending_hashtags.keys())[:3]
            insights.append(f"当前热门标签包括: {', '.join(top_hashtags)}")
        
        # 整体表现洞察
        if posts:
            avg_engagement = sum(post.engagement_rate for post in posts) / len(posts)
            insights.append(f"平均互动率为{avg_engagement:.3f}%")
        
        return "; ".join(insights)
    
    def analyze_competitive_landscape(self, posts: List[InstagramPost], competitors: List[str]) -> Dict:
        """分析竞争格局"""
        landscape = {}
        
        for competitor in competitors:
            competitor_posts = [post for post in posts if post.account.username == competitor]
            
            if competitor_posts:
                avg_engagement = sum(post.engagement_rate for post in competitor_posts) / len(competitor_posts)
                total_posts = len(competitor_posts)
                
                landscape[competitor] = {
                    "total_posts": total_posts,
                    "avg_engagement_rate": avg_engagement,
                    "market_share": total_posts / len(posts) if posts else 0
                }
        
        return landscape
    
    def generate_recommended_strategies(self, category_performance: Dict, trending_hashtags: Dict) -> List[str]:
        """生成推荐策略"""
        strategies = []
        
        # 基于内容分类表现
        if category_performance:
            best_category = max(category_performance.items(), key=lambda x: x[1]["avg_engagement"])
            strategies.append(f"增加'{best_category[0]}'类型的内容发布频率")
        
        # 基于热门标签
        if trending_hashtags:
            top_hashtags = list(trending_hashtags.keys())[:5]
            strategies.append(f"在内容中使用热门标签: {', '.join(top_hashtags)}")
        
        # 通用策略
        strategies.extend([
            "在最佳发布时间(晚上6-10点)发布内容",
            "使用轮播图格式提高互动率",
            "保持一致的发布频率"
        ])
        
        return strategies
    
    def analyze_optimal_posting_times(self, posts: List[InstagramPost]) -> Dict:
        """分析最佳发布时间"""
        hourly_performance = {}
        
        for post in posts:
            if post.posted_at:
                # 转换为沙特时间 (UTC+3)
                saudi_hour = (post.posted_at.hour + 3) % 24
                
                if saudi_hour not in hourly_performance:
                    hourly_performance[saudi_hour] = {
                        "total_posts": 0,
                        "total_engagement": 0,
                        "avg_engagement": 0
                    }
                
                hourly_performance[saudi_hour]["total_posts"] += 1
                hourly_performance[saudi_hour]["total_engagement"] += post.engagement_rate
        
        # 计算平均互动率
        for hour, stats in hourly_performance.items():
            if stats["total_posts"] > 0:
                stats["avg_engagement"] = stats["total_engagement"] / stats["total_posts"]
        
        # 找出最佳发布时间
        if hourly_performance:
            best_hours = sorted(hourly_performance.items(), 
                              key=lambda x: x[1]["avg_engagement"], reverse=True)[:3]
            
            return {
                "best_hours": [hour for hour, _ in best_hours],
                "hourly_performance": hourly_performance
            }
        
        return {"best_hours": [18, 19, 20], "hourly_performance": {}}  # 默认最佳时间
    
    def generate_competitor_benchmark(self, competitors: List[str], days: int = 30) -> CompetitorBenchmark:
        """生成竞争对手基准测试"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            competitor_data = {}
            total_engagement_by_competitor = {}
            content_frequency = {}
            
            for competitor in competitors:
                # 获取账户信息
                account = self.db.query(InstagramAccount).filter(
                    InstagramAccount.username == competitor
                ).first()
                
                if not account:
                    continue
                
                # 获取分析期间的帖子
                posts = self.db.query(InstagramPost).filter(
                    InstagramPost.account_id == account.id,
                    InstagramPost.posted_at >= start_date,
                    InstagramPost.posted_at <= end_date
                ).all()
                
                if posts:
                    # 计算平均互动率
                    avg_engagement = sum(post.engagement_rate for post in posts) / len(posts)
                    
                    # 计算粉丝增长率
                    # 这里简化计算，实际需要历史数据
                    follower_growth = 0  # 需要历史数据来计算真实增长
                    
                    # 内容发布频率
                    content_frequency[competitor] = {
                        "total_posts": len(posts),
                        "posts_per_week": len(posts) / (days / 7),
                        "posts_per_month": len(posts) / (days / 30)
                    }
                    
                    competitor_data[competitor] = {
                        "followers_count": account.followers_count,
                        "avg_engagement_rate": avg_engagement,
                        "follower_growth_rate": follower_growth,
                        "total_posts": len(posts),
                        "content_diversity": len(set(post.content_category for post in posts if post.content_category))
                    }
                    
                    total_engagement_by_competitor[competitor] = avg_engagement
            
            # 计算整体基准
            if total_engagement_by_competitor:
                avg_engagement_rate = sum(total_engagement_by_competitor.values()) / len(total_engagement_by_competitor)
            else:
                avg_engagement_rate = 0
            
            # 计算粉丝增长基准
            avg_follower_growth = sum(data["follower_growth_rate"] for data in competitor_data.values()) / len(competitor_data) if competitor_data else 0
            
            # SWOT分析
            strengths, weaknesses, opportunities, threats = self.perform_swot_analysis(competitor_data)
            
            # 生成建议
            recommendations = self.generate_benchmark_recommendations(competitor_data, avg_engagement_rate)
            
            # 创建基准测试记录
            benchmark = CompetitorBenchmark(
                benchmark_name=f"K12教育竞品基准测试 - {days}天",
                analysis_period=f"{days} days",
                competitor_data=competitor_data,
                avg_engagement_rate=avg_engagement_rate,
                avg_follower_growth=avg_follower_growth,
                content_frequency=content_frequency,
                strengths=strengths,
                weaknesses=weaknesses,
                opportunities=opportunities,
                threats=threats,
                recommendations=recommendations
            )
            
            self.db.add(benchmark)
            self.db.commit()
            
            logger.info(f"竞争对手基准测试生成完成 - 期间: {days}天")
            
            return benchmark
            
        except Exception as e:
            logger.error(f"生成竞争对手基准测试失败: {e}")
            self.db.rollback()
            raise e
    
    def perform_swot_analysis(self, competitor_data: Dict) -> tuple:
        """执行SWOT分析"""
        strengths = []
        weaknesses = []
        opportunities = []
        threats = []
        
        # 分析优势
        if competitor_data:
            best_engagement = max(competitor_data.items(), key=lambda x: x[1]["avg_engagement_rate"])
            strengths.append(f"{best_engagement[0]}拥有最高的平均互动率: {best_engagement[1]['avg_engagement_rate']:.3f}%")
        
        # 分析劣势
        if competitor_data:
            worst_engagement = min(competitor_data.items(), key=lambda x: x[1]["avg_engagement_rate"])
            weaknesses.append(f"{worst_engagement[0]}的平均互动率较低: {worst_engagement[1]['avg_engagement_rate']:.3f}%")
        
        # 分析机会
        opportunities.extend([
            "在线K12教育市场在沙特持续增长",
            "社交媒体营销在教育行业的应用日益广泛",
            "家长对优质在线教育资源的需求增加"
        ])
        
        # 分析威胁
        threats.extend([
            "市场竞争日益激烈",
            "用户对内容质量的要求不断提高",
            "平台算法变化可能影响内容传播"
        ])
        
        return strengths, weaknesses, opportunities, threats
    
    def generate_benchmark_recommendations(self, competitor_data: Dict, avg_engagement_rate: float) -> List[str]:
        """生成基准测试建议"""
        recommendations = []
        
        # 基于互动率表现
        if competitor_data:
            for competitor, data in competitor_data.items():
                if data["avg_engagement_rate"] > avg_engagement_rate * 1.2:
                    recommendations.append(f"学习{competitor}的内容策略，其互动率高于平均水平")
        
        # 通用建议
        recommendations.extend([
            f"目标互动率应达到或超过平均水平: {avg_engagement_rate:.3f}%",
            "增加内容多样性，尝试不同的内容类型",
            "优化发布时间以提高互动率",
            "加强与用户的互动和回复"
        ])
        
        return recommendations