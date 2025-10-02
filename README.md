# Instagram竞争对手分析仪表盘 (Instagram Competitor Analysis Dashboard)

一个专业的Instagram竞争对手分析工具，专门针对沙特K12教育市场，提供深度数据挖掘、内容分析和市场趋势洞察。

## 🎯 项目概述

本项目旨在帮助教育品牌深度分析沙特K12市场的主要竞争对手在Instagram上的内容策略，提供数据驱动的营销洞察和策略建议。

### 主要追踪目标
- **@51talkksa** - 51Talk沙特官方账号
- **@novakid_mena** - Novakid中东地区账号
- **@vipkid_ar** - VIPKid阿拉伯地区账号

### 核心功能
✅ Instagram数据自动抓取与存储
✅ 智能内容分类（5大类别）
✅ 阿拉伯语情感分析
✅ 竞争对手基准测试
✅ 实时趋势分析
✅ 可视化数据仪表盘
✅ 营销策略建议

## 🏗️ 技术架构

### 后端技术栈
- **FastAPI** - 高性能Python Web框架
- **PostgreSQL** - 关系型数据库
- **SQLAlchemy** - ORM框架
- **Instaloader** - Instagram数据抓取
- **Transformers** - AI情感分析模型
- **Celery + Redis** - 异步任务队列
- **Docker** - 容器化部署

### 前端技术栈
- **Next.js 14** - React全栈框架
- **React 18** - 用户界面库
- **TypeScript** - 类型安全
- **Ant Design** - UI组件库
- **Tailwind CSS** - 样式框架
- **Recharts** - 数据可视化
- **React Query** - 数据获取与状态管理

### 数据库设计
- **Instagram账户表** - 存储竞品账户信息
- **Instagram帖子表** - 存储帖子内容与互动数据
- **Instagram评论表** - 存储评论数据
- **内容分析表** - 存储AI分析结果
- **趋势分析表** - 存储市场趋势数据

## 🚀 快速开始

### 环境要求
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (可选)

### 1. 克隆项目
```bash
git clone https://github.com/RuihuaChen0707/ins-collector.git
cd ins-collector
```

### 2. 环境配置
复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填写必要的配置：
```env
# 数据库配置
DATABASE_URL=postgresql://username:password@localhost:5432/ins_collector
POSTGRES_DB=ins_collector
POSTGRES_USER=username
POSTGRES_PASSWORD=password

# Instagram配置
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password

# API密钥 (可选)
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Redis配置
REDIS_URL=redis://localhost:6379/0

# 应用配置
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=True

# 前端配置
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. 使用Docker部署 (推荐)
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 4. 手动部署

#### 后端部署
```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 数据库迁移
alembic upgrade head

# 启动服务
python -m app.main
```

#### 前端部署
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

## 📊 功能详解

### 1. 竞品监控
- **账户追踪** - 实时监控目标竞品账户动态
- **内容抓取** - 自动获取帖子、评论、互动数据
- **数据存储** - 结构化存储所有抓取数据

### 2. 内容分析
#### 智能分类 (5大类别)
1. **互动游戏/竞赛** - 用户参与类内容
2. **促销/销售** - 营销推广内容
3. **纯教育内容** - 知识分享类内容
4. **品牌/社区** - 品牌建设内容
5. **其他** - 无法分类的内容

#### 情感分析
- **阿拉伯语支持** - 专门优化的阿拉伯语情感分析
- **多维度评分** - 积极/中性/消极三分类
- **置信度评估** - 提供分析可信度指标

### 3. 趋势分析
- **热门标签追踪** - #تعليم_انجليزي_للاطفال 等教育相关标签
- **互动率趋势** - 时间序列分析互动表现
- **内容类型趋势** - 不同内容类型的表现变化
- **市场洞察** - AI生成的市场分析报告

### 4. 基准测试
- **竞争对手对比** - 多维度性能对比
- **SWOT分析** - 优势劣势机会威胁分析
- **推荐策略** - 基于数据的营销建议

## 🎯 内容分类算法

### 关键词匹配 (阿拉伯语 + 英语)
```python
content_categories = {
    "互动游戏/竞赛": {
        "ar": ["مسابقة", "لعبة", "تحدي", "جائزة", "فوز", "ربح"],
        "en": ["contest", "game", "challenge", "prize", "win"]
    },
    "促销/销售": {
        "ar": ["خصم", "عرض", "تخفيض", "سعر", "شراء", "بيع"],
        "en": ["discount", "offer", "sale", "price", "buy"]
    },
    "纯教育内容": {
        "ar": ["تعليم", "تعلم", "درس", "معلومة", "تربية"],
        "en": ["education", "learning", "lesson", "information"]
    },
    "品牌/社区": {
        "ar": ["مجتمع", "أسرة", "تواصل", "علاقة", "دعم"],
        "en": ["community", "family", "connection", "relationship"]
    }
}
```

### 情感分析模型
- **模型**: Cardiff NLP Twitter XLM-RoBERTa Base Sentiment
- **语言支持**: 多语言，特别优化阿拉伯语
- **输出**: 情感分数 (-1到1) + 置信度

## 📈 API端点

### Instagram相关API
```
GET  /api/instagram/accounts          # 获取账户列表
GET  /api/instagram/accounts/{username}  # 获取特定账户
GET  /api/instagram/competitors       # 获取竞品分析
GET  /api/instagram/posts             # 获取帖子列表
GET  /api/instagram/posts/{post_id}   # 获取特定帖子
POST /api/instagram/scrape-accounts   # 触发数据抓取
```

### 分析相关API
```
GET  /api/analysis/content/{post_id}           # 获取内容分析
POST /api/analysis/content/analyze/{post_id}   # 分析内容
GET  /api/analysis/content/category-distribution  # 分类分布
GET  /api/analysis/sentiment/overview          # 情感分析概览
GET  /api/analysis/trends/latest               # 最新趋势
POST /api/analysis/trends/generate             # 生成趋势分析
GET  /api/analysis/competitors/benchmark       # 竞品基准测试
GET  /api/analysis/performance/engagement      # 互动表现
```

## 🔧 开发指南

### 添加新的竞品账户
编辑 `backend/app/services/instagram_scraper.py`：
```python
self.target_competitors = [
    "51talkksa",
    "novakid_mena", 
    "vipkid_ar",
    "new_competitor_username"  # 添加新账号
]
```

### 修改内容分类规则
编辑 `backend/app/services/analysis_service.py`：
```python
self.content_categories = {
    "新分类": {
        "ar": ["阿拉伯语关键词"],
        "en": ["english keywords"]
    }
}
```

### 自定义分析模型
替换情感分析模型：
```python
self.sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="your-custom-model",
    tokenizer="your-custom-tokenizer"
)
```

## 📋 数据字段说明

### Instagram账户数据
- `username`: 账户用户名
- `followers_count`: 粉丝数量
- `posts_count`: 帖子数量
- `is_verified`: 是否认证
- `biography`: 个人简介
- `profile_pic_url`: 头像URL

### Instagram帖子数据
- `post_id`: 帖子唯一ID
- `caption`: 帖子标题
- `media_type`: 媒体类型 (image/video/carousel)
- `likes_count`: 点赞数量
- `comments_count`: 评论数量
- `engagement_rate`: 互动率计算
- `content_category`: AI分类结果
- `sentiment_score`: 情感分析分数

### 内容分析数据
- `content_category`: 内容分类
- `category_confidence`: 分类置信度
- `sentiment_score`: 情感分数 (-1到1)
- `sentiment_label`: 情感标签
- `keywords`: 关键词列表
- `content_quality_score`: 内容质量评分

## 🚨 注意事项

### Instagram使用限制
- 遵守Instagram服务条款
- 合理设置抓取频率避免被封禁
- 使用代理IP分散请求
- 建议每日抓取不超过1000条数据

### 数据隐私
- 仅收集公开可用的数据
- 不存储用户敏感信息
- 遵守GDPR等数据保护法规
- 定期清理过期数据

### 性能优化
- 使用Redis缓存频繁查询
- 数据库索引优化查询速度
- 异步处理大批量数据
- 前端数据分页加载

## 🔍 故障排除

### 常见问题

**Q: Instagram登录失败**
A: 检查用户名密码是否正确，或启用双因素认证后使用应用密码

**Q: 数据抓取受限**
A: 降低抓取频率，使用代理IP，或暂停一段时间后重试

**Q: 情感分析不准确**
A: 阿拉伯语内容需要专门模型，考虑使用更大的预训练模型

**Q: 前端显示异常**
A: 检查API连接是否正常，查看浏览器控制台错误信息

### 日志查看
```bash
# 后端日志
tail -f backend/logs/app.log

# 前端日志
docker-compose logs frontend

# 数据库日志
docker-compose logs postgres
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目维护者: Rui Chen
- GitHub: [@RuihuaChen0707](https://github.com/RuihuaChen0707)
- 项目地址: [https://github.com/RuihuaChen0707/ins-collector](https://github.com/RuihuaChen0707/ins-collector)

---

## 🌟 项目亮点

- **AI驱动分析** - 使用先进的NLP模型进行内容理解和情感分析
- **多语言支持** - 特别优化阿拉伯语处理能力
- **实时数据** - 提供近实时的竞品监控和趋势分析
- **专业可视化** - 丰富的图表和仪表盘展示
- **可扩展架构** - 模块化设计，易于扩展和维护
- **容器化部署** - 支持Docker快速部署和扩展

**Made with ❤️ for the Saudi K12 education market**