const express = require('express');
const multer = require('multer');
const os = require('os');
const AdminController = require('../controllers/admin.controller');
const { adminAuth } = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

// 应用管理员认证中间件
router.use(adminAuth);

// 管理后台首页（仅显示功能按钮）
router.get('/', AdminController.showAdminPage);

// 圣经导入
router.get('/import', AdminController.showImportPage);
router.post('/import/upload', upload.single('file'), AdminController.handleUpload);

// AI 提示词管理
router.get('/prompts', AdminController.showPromptsPage);
router.get('/prompts/edit/:id', AdminController.showEditPromptPage);
router.post('/prompts/update/:id', AdminController.updatePrompt);
router.post('/prompts/toggle/:id', AdminController.togglePrompt);

// AI 结果管理
router.get('/ai-results', AdminController.showAIResultsPage);
router.post('/ai-results/delete/:id', AdminController.deleteAIResult);
router.post('/ai-results/clear-all', AdminController.clearAllAIResults);

module.exports = router;
