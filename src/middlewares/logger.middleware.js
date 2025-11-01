const Logger = require('../utils/logger');

/**
 * 请求日志中间件
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  // 响应完成时记录日志
  res.on('finish', () => {
    const duration = Date.now() - start;
    Logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

module.exports = {
  requestLogger
};
