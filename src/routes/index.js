const express = require('express');
const adminRoutes = require('./admin.routes');
// const bibleRoutes = require('./bible.routes'); // 已禁用：改用 Hash 路由 + API
const apiRoutes = require('./api.routes');

const router = express.Router();

// API 路由（返回 JSON）
router.use('/api', apiRoutes);

// 管理后台路由
router.use('/admin', adminRoutes);

// 圣经阅读路由（已禁用：改用单页应用 + Hash 路由）
// router.use('/', bibleRoutes);

module.exports = router;
