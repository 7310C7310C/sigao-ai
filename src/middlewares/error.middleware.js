const Logger = require('../utils/logger');

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  Logger.error('Error:', err);

  // 默认错误状态码
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // 开发环境显示详细错误
  if (process.env.NODE_ENV !== 'production') {
    res.status(statusCode).json({
      success: false,
      message,
      error: err.stack
    });
  } else {
    // 生产环境只显示简单消息
    res.status(statusCode).json({
      success: false,
      message
    });
  }
}

/**
 * 404 处理中间件
 */
function notFoundHandler(req, res) {
  res.status(404).render('errors/404', {
    url: req.originalUrl
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
