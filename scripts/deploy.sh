#!/bin/bash
# ================================================
# 智联数通 MVV 共创小程序 - 阿里云一键部署脚本
# 适用：阿里云 ECS / 轻量应用服务器 (Ubuntu 20.04+)
# ================================================

set -e

echo "==========================================="
echo "  🚀 智联数通 MVV 后端 - 阿里云部署脚本"
echo "==========================================="

# ---- 1. 检查环境 ----
echo ""
echo "📋 [1/5] 检查环境..."

if ! command -v docker &> /dev/null; then
    echo "   ⚠️  Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "   ✅ Docker 安装完成"
else
    echo "   ✅ Docker 已安装"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "   ⚠️  Docker Compose 未安装，正在安装..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "   ✅ Docker Compose 安装完成"
else
    echo "   ✅ Docker Compose 已安装"
fi

# ---- 2. 克隆代码 ----
echo ""
echo "📦 [2/5] 克隆/更新代码..."

APP_DIR="/opt/mvv-app"
if [ -d "$APP_DIR" ]; then
    echo "   ⏳ 目录已存在，拉取最新代码..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "   ⏳ 首次克隆代码..."
    sudo mkdir -p "$APP_DIR"
    sudo chown "$(whoami):$(whoami)" "$APP_DIR"
    git clone https://github.com/zlst2006/mvv-app.git "$APP_DIR"
    cd "$APP_DIR"
fi

# ---- 3. 配置环境变量 ----
echo ""
echo "🔑 [3/5] 配置环境变量..."

ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "   ⏳ 请先设置以下环境变量（从 Supabase 控制台获取）："
    echo ""
    read -p "   COZE_SUPABASE_URL (例如 https://xxxx.supabase.co): " SUPABASE_URL
    read -p "   COZE_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
    read -p "   COZE_SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
    read -p "   ADMIN_PASSWORD (管理员密码, 默认 adminzlst@2026): " ADMIN_PW
    ADMIN_PW=${ADMIN_PW:-adminzlst@2026}

    cat > "$ENV_FILE" << EOF
COZE_SUPABASE_URL=${SUPABASE_URL}
COZE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
COZE_SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ADMIN_PASSWORD=${ADMIN_PW}
EOF
    echo "   ✅ .env 配置文件已生成"
else
    echo "   ✅ .env 配置文件已存在"
fi

# ---- 4. 构建并启动 ----
echo ""
echo "🔨 [4/5] 构建 Docker 镜像并启动..."

cd "$APP_DIR"

# 停止旧容器
docker-compose down 2>/dev/null || true

# 构建并启动
docker-compose up -d --build

echo "   ✅ 服务启动完成"

# ---- 5. 验证 ----
echo ""
echo "✅ [5/5] 验证服务..."

sleep 3
if curl -s http://localhost:3000/api/mvv/users > /dev/null 2>&1; then
    echo "   ✅ 后端服务运行正常！"
    PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || curl -s http://ifconfig.me 2>/dev/null || echo "请自行查询服务器公网IP")
    echo ""
    echo "==========================================="
    echo "  🎉 部署成功！"
    echo "==========================================="
    echo ""
    echo "  后端地址: http://${PUBLIC_IP}:3000"
    echo "  API 测试: http://${PUBLIC_IP}:3000/api/mvv/users"
    echo ""
    echo "  ⚠️  重要提醒："
    echo "  1. 在阿里云安全组中放开端口 3000（TCP）"
    echo "  2. 在微信小程序后台配置 request 合法域名："
    echo "     https://${PUBLIC_IP}"
    echo "  3. 使用微信开发者工具上传 dist/ 目录"
    echo ""
else
    echo "   ❌ 服务验证失败，请检查日志："
    echo "   docker-compose logs mvv-server"
fi

echo ""
echo "📋 常用命令："
echo "   查看日志:  docker-compose logs -f mvv-server"
echo "   重启服务:  docker-compose restart mvv-server"
echo "   停止服务:  docker-compose down"
echo "   更新代码:  cd $APP_DIR && git pull && docker-compose up -d --build"
echo ""