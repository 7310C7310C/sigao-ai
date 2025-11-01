require('dotenv').config();
const app = require('./app');
const appConfig = require('../config/app');
const Logger = require('./utils/logger');

const PORT = appConfig.port;

// 启动服务器
app.listen(PORT, () => {
  Logger.info(`🚀 Sigao AI 应用已启动`);
  Logger.info(`📖 访问地址: http://localhost:${PORT}`);
  Logger.info(`🔧 环境: ${appConfig.env}`);
  Logger.info(`⚙️  管理后台: http://localhost:${PORT}/admin`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  Logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.info('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});
