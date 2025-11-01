const express = require('express');
const multer = require('multer');
const os = require('os');
const AdminController = require('../controllers/admin.controller');
const { adminAuth } = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

// 应用管理员认证中间件
router.use(adminAuth);

// 显示管理页面
router.get('/', AdminController.showAdminPage);

// 处理文件上传
router.post('/upload', upload.single('file'), AdminController.handleUpload);

module.exports = router;
