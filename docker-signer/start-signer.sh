#!/bin/bash
# Verbitto 签名代理一键启动脚本
# OpenClaw Agent 只需执行此脚本即可

set -e

CONTAINER_NAME="verbitto-signer"
IMAGE_NAME="verbitto-signer:latest"
PORT=3344

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🦞 Verbitto 签名代理服务启动器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 检查 Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ 未安装 Docker${NC}"
  echo "请访问 https://docs.docker.com/get-docker/ 安装 Docker"
  exit 1
fi

# 2. 查找钱包
WALLET_PATH=""
WALLET_PATHS=(
  "$HOME/.config/solana/id.json"
  "$HOME/.verbitto-agent/wallet.json"
  "./wallet.json"
)

for path in "${WALLET_PATHS[@]}"; do
  if [ -f "$path" ]; then
    WALLET_PATH="$path"
    echo -e "${GREEN}✅ 找到钱包: $WALLET_PATH${NC}"
    break
  fi
done

if [ -z "$WALLET_PATH" ]; then
  echo -e "${RED}❌ 未找到钱包文件${NC}"
  echo "请确保以下路径之一存在："
  for path in "${WALLET_PATHS[@]}"; do
    echo "  - $path"
  done
  exit 1
fi

# 3. 停止旧容器
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${YELLOW}⏹️  停止旧容器...${NC}"
  docker stop $CONTAINER_NAME > /dev/null 2>&1 || true
  docker rm $CONTAINER_NAME > /dev/null 2>&1 || true
fi

# 4. 构建镜像（如果本地有 Dockerfile）
if [ -f "./Dockerfile" ] && [ -f "./verbitto-signer.js" ]; then
  echo -e "${YELLOW}🔨 构建镜像...${NC}"
  docker build -t $IMAGE_NAME . > /dev/null 2>&1
elif ! docker images | grep -q "verbitto-signer"; then
  echo -e "${RED}❌ 未找到镜像，请确保当前目录有 Dockerfile${NC}"
  exit 1
fi

# 5. 启动容器
echo -e "${YELLOW}🚀 启动签名服务...${NC}"
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:$PORT \
  -v "$WALLET_PATH:/wallet/id.json:ro" \
  --restart unless-stopped \
  $IMAGE_NAME

# 6. 等待服务就绪
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
for i in {1..10}; do
  if curl -sf http://localhost:$PORT/health > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# 7. 验证服务
if curl -sf http://localhost:$PORT/health > /dev/null 2>&1; then
  WALLET=$(curl -s http://localhost:$PORT/health | grep -o '"wallet":"[^"]*"' | cut -d'"' -f4)
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}✅ 签名服务已启动${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "📡 地址: ${GREEN}http://localhost:$PORT${NC}"
  echo -e "🔑 钱包: ${GREEN}$WALLET${NC}"
  echo ""
  echo "OpenClaw Agent 使用示例："
  echo -e "${YELLOW}curl -X POST http://localhost:$PORT/verbitto/execute \\${NC}"
  echo -e "${YELLOW}  -H \"Content-Type: application/json\" \\${NC}"
  echo -e "${YELLOW}  -d '{\"action\":\"registerAgent\",\"params\":{\"skillTags\":6}}'${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "查看日志: docker logs -f $CONTAINER_NAME"
  echo "停止服务: docker stop $CONTAINER_NAME"
else
  echo -e "${RED}❌ 服务启动失败${NC}"
  echo "查看日志: docker logs $CONTAINER_NAME"
  exit 1
fi
