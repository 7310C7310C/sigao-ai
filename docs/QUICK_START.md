# 快速开始指南

## 一、首次安装

### 1. 克隆项目
```bash
git clone <repository-url>
cd sigao-ai
```

### 2. 配置环境变量

**推荐：使用配置向导**
```bash
bash scripts/setup-env.sh
```

向导会询问以下信息：
- 运行环境（开发/生产）
- 数据库配置
- 管理员账户
- AI 服务密钥
- 日志设置

**或者：手动配置**
```bash
cp .env.example .env
nano .env  # 编辑配置
```

### 3. 验证配置
```bash
bash scripts/verify-env.sh
```

### 4. 启动服务
```bash
# Docker 环境（推荐）
docker-compose up -d

# 或本地环境
npm install
npm start
```

### 5. 访问应用
- 主页：http://localhost:3000
- 管理后台：http://localhost:3000/admin

## 二、环境变量说明

### 必须配置的项目

| 变量 | 说明 | 示例 |
|------|------|------|
| `DB_HOST` | 数据库主机 | `mysql` (Docker) 或 `127.0.0.1` |
| `DB_USER` | 数据库用户 | `sigao` |
| `DB_PASS` | 数据库密码 | `your_password` |
| `DB_NAME` | 数据库名称 | `sigao_ai` |
| `ADMIN_PASS` | 管理员密码 | **必须修改！** |

### 可选配置项

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务端口 | `3000` |
| `ADMIN_USERNAME` | 管理员用户名 | `admin` |
| `LOG_LEVEL` | 日志级别 | `info` |

### AI 功能配置

| 变量 | 说明 |
|------|------|
| `MAGISTERIUM_API_KEY` | Magisterium API 密钥 |
| `MAGISTERIUM_API_URL` | API 端点地址 |

> 💡 不配置 AI 密钥也可以使用基础功能（阅读圣经），只是 AI 辅助功能不可用

## 三、常见配置场景

### 开发环境

```bash
NODE_ENV=development
PORT=3000
DB_HOST=127.0.0.1
DB_USER=sigao
DB_PASS=sigao
ADMIN_PASS=dev123
```

### Docker 环境

```bash
NODE_ENV=development
PORT=3000
DB_HOST=mysql        # 使用 Docker Compose 服务名
DB_USER=sigao
DB_PASS=sigao
ADMIN_PASS=dev123
```

### 生产环境

```bash
NODE_ENV=production
PORT=3000
DB_HOST=your_db_host
DB_USER=sigao_prod
DB_PASS=Very_Strong_Password_123!
ADMIN_PASS=Another_Strong_Password_456!
```

## 四、安全检查清单

### 生产环境部署前必查

- [ ] `ADMIN_PASS` 已修改为强密码（至少12位）
- [ ] `DB_PASS` 已修改为强密码（至少16位）
- [ ] `.env` 文件权限设置为 600
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] 数据库只允许内网访问
- [ ] 启用 HTTPS
- [ ] 设置防火墙规则

### 密码强度要求

**管理员密码：**
- 至少 12 位
- 包含大小写字母
- 包含数字
- 包含特殊字符

**数据库密码：**
- 至少 16 位
- 高度随机
- 避免常见单词

**生成强密码示例：**
```bash
# Linux/Mac
openssl rand -base64 24

# 或使用密码管理器生成
```

## 五、验证安装

### 1. 检查配置
```bash
bash scripts/verify-env.sh
```

应该看到：
```
✅ .env 文件存在
✅ 文件权限正确 (600)
✅ 配置验证通过！
```

### 2. 检查服务状态
```bash
# Docker 环境
docker-compose ps

# 应该看到 app 和 mysql 都在运行
```

### 3. 检查日志
```bash
# Docker 环境
docker-compose logs -f app

# 应该看到类似输出：
# 📖 思高圣经 AI 系统启动成功
# 🚀 服务器运行在端口: 3000
# 📖 访问地址: http://localhost:3000
```

### 4. 测试访问
```bash
# 测试主页
curl http://localhost:3000

# 测试 API
curl http://localhost:3000/api/books

# 测试管理后台（会提示认证）
curl -I http://localhost:3000/admin
```

## 六、故障排除

### 问题：数据库连接失败

**症状：** `ECONNREFUSED` 或 `ER_ACCESS_DENIED_ERROR`

**解决方案：**
1. 检查数据库是否启动
   ```bash
   docker-compose ps mysql
   ```
2. 验证 `DB_HOST` 配置
   - Docker 环境使用 `mysql`
   - 本地环境使用 `127.0.0.1`
3. 确认数据库密码正确
4. 查看数据库日志
   ```bash
   docker-compose logs mysql
   ```

### 问题：无法登录管理后台

**症状：** 用户名或密码错误

**解决方案：**
1. 确认 `.env` 中的密码设置
   ```bash
   grep ADMIN .env
   ```
2. 重启应用加载新配置
   ```bash
   docker-compose restart app
   ```
3. 尝试默认账户（仅开发环境）
   - 用户名：admin
   - 密码：admin

### 问题：AI 功能不可用

**症状：** AI 按钮点击无响应或报错

**解决方案：**
1. 检查 API 密钥是否设置
   ```bash
   grep MAGISTERIUM .env
   ```
2. 验证 API 密钥是否有效
3. 查看应用日志
   ```bash
   docker-compose logs app | grep -i magisterium
   ```

### 问题：端口已被占用

**症状：** `EADDRINUSE` 错误

**解决方案：**
1. 修改端口配置
   ```bash
   # 在 .env 中修改
   PORT=3001
   ```
2. 或停止占用端口的进程
   ```bash
   # 查找占用端口的进程
   lsof -i :3000
   
   # 停止进程
   kill <PID>
   ```

## 七、下一步

配置完成后，可以：

1. **导入圣经数据**
   - 访问管理后台
   - 上传 Excel 文件
   - 等待导入完成

2. **自定义 AI 提示词**
   - 管理后台 → AI 提示词管理
   - 编辑或添加新的提示词

3. **阅读圣经**
   - 访问主页
   - 选择书卷和章节
   - 享受阅读体验

4. **查看更多文档**
   - [环境配置详解](./CONFIGURATION.md)
   - [API 文档](./api.md)
   - [部署指南](./deployment.md)

## 八、获取帮助

遇到问题？

1. 查看日志
   ```bash
   docker-compose logs -f
   ```
2. 运行验证脚本
   ```bash
   bash scripts/verify-env.sh
   ```
3. 查看文档
   - docs/CONFIGURATION.md
   - docs/deployment.md
4. 提交 Issue
   - 描述问题
   - 附上日志
   - 说明环境信息
