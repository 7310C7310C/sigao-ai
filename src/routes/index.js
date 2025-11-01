const express = require('express');
const adminRoutes = require('./admin.routes');
const bibleRoutes = require('./bible.routes');

const router = express.Router();

// 管理后台路由
router.use('/admin', adminRoutes);

// 圣经阅读路由（挂载到根路径）
router.use('/', bibleRoutes);

module.exports = router;
