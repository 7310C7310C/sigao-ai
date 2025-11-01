const express = require('express');
const path = require('path');
const routes = require('./routes');
const { requestLogger } = require('./middlewares/logger.middleware');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// 视图引擎配置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// 静态文件
app.use(express.static(path.join(__dirname, '..', 'public')));

// 请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志中间件
app.use(requestLogger);

// 路由
app.use('/', routes);

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

module.exports = app;
