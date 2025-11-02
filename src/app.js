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
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// 设置响应字符集
app.use(function(req, res, next) {
  // 为所有响应设置 charset
  var originalJson = res.json;
  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson.call(this, data);
  };
  next();
});

// 日志中间件
app.use(requestLogger);

// 路由
app.use('/', routes);

// SPA 回退：所有非 API 请求返回 index.html（支持 Hash 路由）
app.get('*', function(req, res, next) {
  // 排除 API 路由和静态资源
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/admin/') ||
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }
  // 返回 SPA 入口页面
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

module.exports = app;
