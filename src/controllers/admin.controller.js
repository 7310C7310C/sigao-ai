const ImportService = require('../services/import.service');
const Logger = require('../utils/logger');

/**
 * 管理后台控制器
 */
class AdminController {
  /**
   * 显示管理页面
   */
  static async showAdminPage(req, res) {
    res.render('admin/index', { message: null });
  }

  /**
   * 处理文件上传和导入
   */
  static async handleUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).send('No file uploaded');
      }

      Logger.info(`开始处理上传文件: ${req.file.originalname}`);
      
      const result = await ImportService.importFromExcel(req.file.path);
      
      res.render('admin/index', { 
        message: `成功导入 ${result.rowCount} 行数据，共 ${result.verseCount} 条经文` 
      });
    } catch (error) {
      Logger.error('上传处理失败:', error);
      res.render('admin/index', { 
        message: `错误: ${error.message}` 
      });
    }
  }
}

module.exports = AdminController;
