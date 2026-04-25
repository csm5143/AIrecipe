#!/bin/bash
# ===========================================
# AIRecipe 生产部署脚本
# 用法: bash deploy.sh
# ===========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 检查必要文件
if [ ! -f ".env" ]; then
    warn ".env 文件不存在，复制 .env.production.example 模板..."
    cp .env.production.example .env
    warn "请编辑 .env 文件，填写实际的配置值！"
    exit 1
fi

log "开始部署 AIRecipe..."

# 构建并启动
log "构建 Docker 镜像..."
docker compose -f docker-compose.prod.yml build --no-cache

log "启动服务..."
docker compose -f docker-compose.prod.yml up -d

# 等待服务启动
log "等待服务就绪..."
sleep 10

# 检查健康状态
log "检查服务状态..."
API_HEALTH=$(curl -sf http://localhost:3000/health 2>/dev/null || echo '{"status":"down"}')
if echo "$API_HEALTH" | grep -q "ok"; then
    log "✅ API 服务运行正常"
else
    warn "⚠️ API 服务可能还未就绪，查看日志：docker compose -f docker-compose.prod.yml logs admin-api"
fi

NGINX_STATUS=$(docker compose -f docker-compose.prod.yml ps nginx 2>/dev/null | grep -c "Up" || echo 0)
if [ "$NGINX_STATUS" -gt 0 ]; then
    log "✅ Nginx 运行正常"
else
    warn "⚠️ Nginx 未启动，查看日志：docker compose -f docker-compose.prod.yml logs nginx"
fi

echo ""
log "========================================"
log "  部署完成！"
log "========================================"
echo ""
log "访问地址："
log "  管理后台: http://你的服务器IP"
log "  API 接口: http://你的服务器IP/api/v1"
log "  API 健康: http://你的服务器IP/api/v1/health"
echo ""
log "常用命令："
log "  查看日志: docker compose -f docker-compose.prod.yml logs -f"
log "  重启服务: docker compose -f docker-compose.prod.yml restart"
log "  停止服务: docker compose -f docker-compose.prod.yml down"
log "  更新部署: bash deploy.sh"
echo ""
