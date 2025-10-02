#!/bin/bash

# Instagram竞争对手分析仪表盘启动脚本
# Instagram Competitor Analysis Dashboard Startup Script

set -e

echo "🚀 启动Instagram竞争对手分析仪表盘..."
echo "🚀 Starting Instagram Competitor Analysis Dashboard..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    echo "❌ Docker is not installed, please install Docker first"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    echo "❌ Docker Compose is not installed, please install Docker Compose first"
    exit 1
fi

# 检查.env文件是否存在
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件，将使用默认配置"
    echo "⚠️  .env file not found, will use default configuration"
    echo "📋 请复制.env.example到.env并根据需要修改配置"
    echo "📋 Please copy .env.example to .env and modify as needed"
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p frontend/.next
mkdir -p data/postgres
mkdir -p data/redis

# 启动服务
echo "🐳 启动Docker容器..."
echo "🐳 Starting Docker containers..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
echo "⏳ Waiting for services to start..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
echo "🔍 Checking service status..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ 服务已成功启动！"
    echo "✅ Services started successfully!"
    echo ""
    echo "📊 应用访问地址:"
    echo "📊 Application URLs:"
    echo "  🌐 前端应用: http://localhost:3000"
    echo "  🌐 Frontend: http://localhost:3000"
    echo "  🔧 后端API: http://localhost:8000"
    echo "  🔧 Backend API: http://localhost:8000"
    echo "  📖 API文档: http://localhost:8000/docs"
    echo "  📖 API Docs: http://localhost:8000/docs"
    echo ""
    echo "🎯 目标竞品账号:"
    echo "🎯 Target competitor accounts:"
    echo "  📱 @51talkksa"
    echo "  📱 @novakid_mena"
    echo "  📱 @vipkid_ar"
    echo ""
    echo "📈 功能模块:"
    echo "📈 Features:"
    echo "  🔍 竞品监控 - Competitor monitoring"
    echo "  🧠 内容分析 - Content analysis"
    echo "  📊 趋势分析 - Trend analysis"
    echo "  🎯 基准测试 - Benchmark testing"
    echo ""
    echo "📝 查看日志:"
    echo "📝 View logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "🛑 停止服务:"
    echo "🛑 Stop services:"
    echo "  docker-compose down"
else
    echo "❌ 服务启动失败，请查看日志信息"
    echo "❌ Service startup failed, please check logs"
    docker-compose logs
    exit 1
fi

echo "🎉 启动完成！欢迎使用Instagram竞争对手分析仪表盘！"
echo "🎉 Startup complete! Welcome to Instagram Competitor Analysis Dashboard!"