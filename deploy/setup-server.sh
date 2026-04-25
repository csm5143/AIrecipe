#!/bin/bash
# ===========================================
# AIRecipe 服务器初始化脚本
# 在服务器上运行一次即可
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

log "AIRecipe 服务器初始化脚本"
log "=============================="

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    error "请使用 root 用户运行此脚本 (sudo bash setup-server.sh)"
fi

log "更新系统..."
apt update && apt upgrade -y

log "安装基础工具..."
apt install -y curl wget git unzip certbot python3-certbot-nginx ufw

log "安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    log "Docker 已安装: $(docker --version)"
else
    log "Docker 已安装: $(docker --version)"
fi

log "安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log "Docker Compose 已安装: $(docker-compose --version)"
else
    log "Docker Compose 已安装: $(docker-compose --version)"
fi

log "配置防火墙..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log "=============================="
log "服务器初始化完成！"
log "=============================="
echo ""
log "后续步骤："
log "  1. 上传项目到服务器: scp -r ./airecipe root@你的IP:/opt/"
log "  2. 配置环境变量: cp .env.production.example .env && nano .env"
log "  3. 运行部署脚本: bash deploy.sh"
log "  4. 申请 SSL 证书: certbot --nginx -d your-domain.com -d api.your-domain.com"
echo ""
