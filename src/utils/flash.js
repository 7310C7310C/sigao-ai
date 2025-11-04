/**
 * Flash Message 工具
 * 用于在重定向后显示一次性消息
 */

/**
 * 设置 flash message（通过 cookie）
 * @param {object} res - Express response 对象
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, info, warning)
 */
function setFlashMessage(res, message, type) {
  type = type || 'info';
  
  var data = JSON.stringify({
    message: message,
    type: type
  });
  
  // 设置 cookie，有效期 10 秒（足够完成重定向）
  // 注意：不需要手动 encodeURIComponent，res.cookie 会自动编码
  res.cookie('flash_message', data, {
    maxAge: 10000, // 10 秒
    httpOnly: false, // 允许 JavaScript 读取
    path: '/'
  });
}

/**
 * 设置成功消息
 */
function flashSuccess(res, message) {
  setFlashMessage(res, message, 'success');
}

/**
 * 设置错误消息
 */
function flashError(res, message) {
  setFlashMessage(res, message, 'error');
}

/**
 * 设置警告消息
 */
function flashWarning(res, message) {
  setFlashMessage(res, message, 'warning');
}

/**
 * 设置信息消息
 */
function flashInfo(res, message) {
  setFlashMessage(res, message, 'info');
}

module.exports = {
  setFlashMessage: setFlashMessage,
  flashSuccess: flashSuccess,
  flashError: flashError,
  flashWarning: flashWarning,
  flashInfo: flashInfo
};
