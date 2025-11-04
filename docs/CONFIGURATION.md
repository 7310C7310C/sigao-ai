# 环境配置说明

## 快速开始

1. **复制环境变量模板**
   ```bash
   cp .env.example .env
   ```

2. **编辑 `.env` 文件，填入实际配置**
   ```bash
   nano .env  # 或使用你喜欢的编辑器
   ```

3. **重要：生产环境必须修改以下配置**
   - `ADMIN_PASS`: 管理员密码
   - `DB_PASS`: 数据库密码
   - `MAGISTERIUM_API_KEY`: AI 服务 API 密钥

## 配置项说明

### 应用配置

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | `development` | 否 |
| `PORT` | 服务端口 | `3000` | 否 |

**NODE_ENV 可选值：**
- `development`: 开发环境（显示详细错误信息）
- `production`: 生产环境（隐藏错误细节）

### 数据库配置

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `DB_HOST` | 数据库主机 | `127.0.0.1` | 是 |
| `DB_PORT` | 数据库端口 | `3306` | 否 |
| `DB_USER` | 数据库用户名 | `sigao` | 是 |
| `DB_PASS` | 数据库密码 | `sigao` | 是 |
| `DB_NAME` | 数据库名称 | `sigao_ai` | 是 |

**Docker 环境注意事项：**
- 使用 Docker Compose 时，`DB_HOST` 应设置为 `mysql`（服务名）
- 本地开发时，使用 `127.0.0.1` 或 `localhost`

### 管理员配置

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `ADMIN_USERNAME` | 管理员用户名 | `admin` | 否 |
| `ADMIN_PASS` | 管理员密码 | `admin` | **是** |

**⚠️ 安全警告：**
- 生产环境必须修改默认密码！
- 建议使用强密码（至少12位，包含大小写字母、数字和特殊字符）
- 定期更换密码

### AI 服务配置

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `MAGISTERIUM_API_KEY` | Magisterium API 密钥 | - | 是 |
| `MAGISTERIUM_API_URL` | API 端点地址 | `https://www.magisterium.com/api/v1/chat/completions` | 否 |

**获取 API 密钥：**
1. 访问 [Magisterium](https://www.magisterium.com)
2. 注册并登录账户
3. 在控制台生成 API 密钥
4. 将密钥填入 `.env` 文件

### 日志配置

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `LOG_LEVEL` | 日志级别 | `info` | 否 |
| `LOG_DIR` | 日志目录 | `./logs` | 否 |

**LOG_LEVEL 可选值：**
- `debug`: 调试信息（最详细）
- `info`: 一般信息
- `warn`: 警告信息
- `error`: 错误信息（最精简）

## 环境示例

### 开发环境 (.env)

```bash
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sigao
DB_PASS=sigao
DB_NAME=sigao_ai

ADMIN_USERNAME=admin
ADMIN_PASS=dev_password_123

MAGISTERIUM_API_KEY=sk_test_xxxxx
MAGISTERIUM_API_URL=https://www.magisterium.com/api/v1/chat/completions

LOG_LEVEL=debug
LOG_DIR=./logs
```

### Docker 环境 (.env)

```bash
NODE_ENV=development
PORT=3000

# 注意：DB_HOST 使用 Docker 服务名
DB_HOST=mysql
DB_PORT=3306
DB_USER=sigao
DB_PASS=sigao
DB_NAME=sigao_ai

ADMIN_USERNAME=admin
ADMIN_PASS=your_secure_password

MAGISTERIUM_API_KEY=sk_xxxxx
MAGISTERIUM_API_URL=https://www.magisterium.com/api/v1/chat/completions

LOG_LEVEL=info
LOG_DIR=./logs
```

### 生产环境 (.env)

```bash
NODE_ENV=production
PORT=3000

DB_HOST=your_production_db_host
DB_PORT=3306
DB_USER=sigao_prod
DB_PASS=very_strong_password_here
DB_NAME=sigao_ai_prod

ADMIN_USERNAME=admin
ADMIN_PASS=Very_Str0ng_P@ssw0rd!

MAGISTERIUM_API_KEY=sk_live_xxxxx
MAGISTERIUM_API_URL=https://www.magisterium.com/api/v1/chat/completions

LOG_LEVEL=warn
LOG_DIR=/var/log/sigao-ai
```

## 安全最佳实践

1. **永远不要提交 `.env` 文件到版本控制**
   - `.gitignore` 已配置忽略 `.env`
   - 只提交 `.env.example` 作为模板

2. **使用强密码**
   - 管理员密码至少12位
   - 数据库密码至少16位
   - 包含大小写字母、数字和特殊字符

3. **定期更换密钥**
   - 定期更换管理员密码
   - 定期轮换 API 密钥

4. **限制环境变量访问权限**
   ```bash
   chmod 600 .env  # 只有所有者可读写
   ```

5. **使用不同的配置**
   - 开发、测试、生产环境使用不同的密码和密钥
   - 避免在多个环境间共享敏感信息

## 验证配置

启动应用后，检查日志输出：

```bash
npm start
```

查看启动信息：
- ✅ 数据库连接成功
- ✅ 服务器运行在指定端口
- ✅ 环境变量正确加载

## 故障排除

### 数据库连接失败

**错误信息：** `ECONNREFUSED` 或 `ER_ACCESS_DENIED_ERROR`

**解决方案：**
1. 检查 `DB_HOST` 和 `DB_PORT` 是否正确
2. 验证 `DB_USER` 和 `DB_PASS` 是否匹配
3. 确认数据库服务已启动
4. Docker 环境确保 `DB_HOST=mysql`

### 无法登录管理后台

**错误信息：** 用户名或密码错误

**解决方案：**
1. 确认 `.env` 文件中的 `ADMIN_PASS` 设置正确
2. 重启应用以加载新的环境变量
3. 检查是否有特殊字符需要转义

### AI 功能不可用

**错误信息：** API 密钥无效

**解决方案：**
1. 验证 `MAGISTERIUM_API_KEY` 是否正确
2. 检查 API 密钥是否过期
3. 确认 API 端点 URL 正确
4. 查看日志了解详细错误信息

## 相关文档

- [部署指南](./deployment.md)
- [开发指南](./AI_DEVELOPMENT_GUIDE.md)
- [API 文档](./api.md)
