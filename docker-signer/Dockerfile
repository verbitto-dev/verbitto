# Verbitto 签名代理服务 - Docker 镜像
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json ./
RUN npm install --production

# 复制服务文件
COPY verbitto-signer.js ./

# 暴露端口
EXPOSE 3344

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3344/health || exit 1

# 启动服务
CMD ["node", "verbitto-signer.js"]
