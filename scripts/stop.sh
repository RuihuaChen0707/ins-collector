#!/bin/bash

# Instagram竞争对手分析仪表盘停止脚本
# Instagram Competitor Analysis Dashboard Stop Script

set -e

echo "🛑 停止Instagram竞争对手分析仪表盘..."
echo "🛑 Stopping Instagram Competitor Analysis Dashboard..."

# 检查是否在项目目录中
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 未找到docker-compose.yml文件，请确保在项目根目录中执行"
    echo "❌ docker-compose.yml not found, please ensure you are in the project root directory"
    exit 1
fi

# 停止Docker容器
echo "🐳 停止Docker容器..."
echo "🐳 Stopping Docker containers..."
docker-compose down

# 可选：清理数据卷（谨慎使用）
if [ "$1" == "--clean" ]; then
    echo "🧹 清理数据卷..."
    echo "🧹 Cleaning data volumes..."
    docker-compose down -v
    echo "✅ 数据卷已清理"
    echo "✅ Data volumes cleaned"
fi

# 显示最终状态
echo "✅ 服务已成功停止！"
echo "✅ Services stopped successfully!"

if [ "$1" == "--clean" ]; then
    echo "🧹 所有数据已被清除"
    echo "🧹 All data has been cleaned"
fi

echo "👋 感谢使用Instagram竞争对手分析仪表盘！"
echo "👋 Thank you for using Instagram Competitor Analysis Dashboard!" 