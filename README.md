# 思高圣经读经辅助 (Sigao AI)

> 📖 一个现代化的圣经阅读与学习平台，支持移动端和桌面端

## ✨ 特性

- 📱 **移动端优先** - 完美支持 iOS 10+ 和 Android 5.0+
- 🎨 **响应式设计** - 适配所有屏幕尺寸（320px - 1920px）
- 🚀 **快速加载** - 优化的性能和用户体验
- 📚 **多译本支持** - 可导入和切换不同圣经译本
- 🔍 **章节浏览** - 便捷的经卷、章节、经文导航
- 🛠️ **管理后台** - Excel 数据导入功能
- 💾 **阅读记忆** - 自动保存和恢复阅读位置

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd sigao-ai
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，修改数据库密码等配置
```

3. **启动服务**
```bash
docker-compose up -d
```

4. **访问应用**
- 主页: http://localhost:3000
- 管理后台: http://localhost:3000/admin (默认密码：admin)

## 📚 文档

### 用户文档
- [API 文档](docs/api.md) - 接口说明和使用方法
- [部署文档](docs/deployment.md) - 生产环境部署指南
- [数据库文档](docs/database.md) - 数据库结构设计

### 开发文档
- [AI 开发指南](docs/AI_DEVELOPMENT_GUIDE.md) - **使用 AI 开发前端的完整规范**
- [AI 快速参考](docs/AI_QUICK_REFERENCE.md) - **快速复制的提示词模板**
- [移动端兼容性](docs/mobile-compatibility.md) - 兼容性测试指南
- [重构总结](docs/REFACTORING_SUMMARY.md) - 项目重构说明

## 🎯 支持的设备和浏览器

### 移动设备
| 平台 | 最低版本 | 状态 |
|------|---------|------|
| iOS Safari | 10.0+ | ✅ 完全支持 |
| iOS Chrome | 10.0+ | ✅ 完全支持 |
| iOS 微信浏览器 | 10.0+ | ✅ 完全支持 |
| Android Chrome | 5.0+ | ✅ 完全支持 |
| Android 微信浏览器 | 5.0+ | ✅ 完全支持 |

### 桌面浏览器
- ✅ Chrome 49+
- ✅ Firefox 52+
- ✅ Safari 10+
- ✅ Edge 79+

## 📁 项目结构

```
sigao-ai/
├── config/              # 配置文件
├── src/
│   ├── routes/         # 路由层
│   ├── controllers/    # 控制器层
│   ├── services/       # 业务逻辑层
│   ├── models/         # 数据模型层
│   ├── middlewares/    # 中间件
│   └── utils/          # 工具函数
├── views/              # EJS 视图模板
│   ├── admin/          # 管理后台
│   ├── bible/          # 圣经阅读
│   └── errors/         # 错误页面
├── public/             # 静态资源
│   ├── css/            # 样式文件
│   └── js/             # 前端脚本
├── scripts/            # 工具脚本
│   ├── db/             # 数据库脚本
│   ├── import/         # 数据导入
│   └── debug/          # 调试工具
├── sql/                # SQL 文件
│   └── migrations/     # 数据库迁移
├── docs/               # 文档
└── tests/              # 测试文件
```

## 🔧 开发指南

### 使用 AI 开发前端

**重要**：本项目有完整的 AI 开发规范，确保所有前端代码兼容旧设备。

📖 开发前必读：
1. [AI 开发指南](docs/AI_DEVELOPMENT_GUIDE.md) - 详细的开发规范
2. [AI 快速参考](docs/AI_QUICK_REFERENCE.md) - 复制粘贴的提示词模板

**快速开始**：复制以下提示词给 AI

```
请按照思高圣经项目的规范开发前端：
✅ iOS 10+, Android 5.0+, 微信浏览器
✅ 响应式：320px - 1920px
✅ 触摸目标 ≥ 44px
✅ ES5 语法，浏览器前缀
✅ 引用 /css/style.css 和 /js/main.js

详见：docs/AI_QUICK_REFERENCE.md
```

### 启动脚本

```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 导入 Excel 数据
npm run import:dev
```

### 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sigao
DB_PASS=sigao
DB_NAME=sigao_ai

# 应用配置
PORT=3000
NODE_ENV=development

# 管理员密码
ADMIN_PASS=admin
```

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **数据库**: MySQL 8.0
- **视图引擎**: EJS
- **前端**: 原生 JavaScript (ES5 兼容)
- **样式**: CSS3 (响应式 + 浏览器前缀)
- **容器化**: Docker + Docker Compose

## 📊 数据导入

### 通过管理后台上传

1. 访问 http://localhost:3000/admin
2. 使用用户名 `admin` 和配置的密码登录
3. 选择 Excel 文件并上传

### Excel 格式要求

| 列名 | 说明 | 示例 |
|-----|------|-----|
| 约别 | 旧约/新约 | 新约 |
| 经卷类别 | 福音书/使徒书信等 | 福音书 |
| 卷名 | 经卷名称 | 马太福音 |
| 章 | 章节号 | 1 |
| 节 | 节数 | 1 |
| 经文内容 | 经文文本 | 太初有道... |

## 🧪 测试

### 移动端测试

使用 Chrome DevTools：
1. 按 F12 打开开发者工具
2. 按 Ctrl+Shift+M 切换设备模式
3. 选择不同设备（iPhone, iPad, Android）

### 兼容性验证

在浏览器控制台运行：
```javascript
console.log('Version:', window.SigaoApp?.version);
console.log('Old Browser:', window.SigaoApp?.isOldBrowser);
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献前请：
1. 阅读 [AI 开发指南](docs/AI_DEVELOPMENT_GUIDE.md)
2. 确保代码兼容 iOS 10+ 和 Android 5.0+
3. 运行兼容性检查清单
4. 在移动设备模拟器中测试

## 📄 许可证

[MIT License](LICENSE)

## 📧 联系方式

- 项目维护者: [7310C7310C](https://github.com/7310C7310C)
- 问题反馈: [GitHub Issues](../../issues)

---

**🌟 如果这个项目对你有帮助，请给个 Star！**
