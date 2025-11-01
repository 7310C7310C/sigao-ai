const basicAuth = require('express-basic-auth');
const authConfig = require('../../config/auth');

/**
 * 管理员认证中间件
 */
const adminAuth = basicAuth({
  users: { 
    [authConfig.admin.username]: authConfig.admin.password 
  },
  challenge: true,
  realm: 'Sigao Admin Area'
});

module.exports = {
  adminAuth
};
