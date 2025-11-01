# 部署文档

## 开发环境部署

### 前置要求
- Node.js 18+
- Docker & Docker Compose
- Git

### 步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd sigao-ai
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，修改配置
```

3. **启动数据库**
```bash
docker-compose up -d mysql
```

4. **安装依赖**
```bash
npm install
```

5. **启动应用**
```bash
npm run dev
```

6. **访问应用**
- 主页: http://localhost:3000
- 管理后台: http://localhost:3000/admin

## 生产环境部署

### 使用 Docker Compose

1. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env，设置生产环境配置
export NODE_ENV=production
export ADMIN_PASS=<strong-password>
```

2. **启动所有服务**
```bash
docker-compose up -d
```

3. **检查服务状态**
```bash
docker-compose ps
docker-compose logs web
```

### 手动部署

1. **构建应用**
```bash
npm install --production
```

2. **配置 Nginx 反向代理**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **使用 PM2 管理进程**
```bash
npm install -g pm2
pm2 start src/index.js --name sigao-ai
pm2 save
pm2 startup
```

## 数据库迁移

初始化数据库表结构：
```bash
docker-compose exec mysql mysql -u sigao -p sigao_ai < sql/migrations/001_initial.sql
```

## 数据导入

通过管理后台上传 Excel 文件，或使用脚本：
```bash
npm run import:dev
```

## 备份

### 数据库备份
```bash
docker-compose exec mysql mysqldump -u sigao -p sigao_ai > backup_$(date +%Y%m%d).sql
```

### 恢复数据库
```bash
docker-compose exec -T mysql mysql -u sigao -p sigao_ai < backup_20250101.sql
```

## 监控和日志

### 查看应用日志
```bash
# Docker 环境
docker-compose logs -f web

# PM2 环境
pm2 logs sigao-ai
```

### 日志文件位置
- 应用日志: `logs/app.log`
- 错误日志: `logs/error.log`
- 访问日志: `logs/access.log`

## 故障排查

### 应用无法启动
1. 检查环境变量配置
2. 检查数据库连接
3. 查看日志文件

### 数据库连接失败
1. 确认 MySQL 服务已启动
2. 检查数据库配置
3. 验证网络连接

### 文件上传失败
1. 检查临时目录权限
2. 确认 Excel 文件格式正确
3. 查看错误日志
