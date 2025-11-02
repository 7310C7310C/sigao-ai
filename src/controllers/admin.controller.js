const ImportService = require('../services/import.service');
const AIPrompt = require('../models/AIPrompt');
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

  /**
   * 显示 AI 提示词管理页面
   */
  static async showPromptsPage(req, res) {
    try {
      var prompts = await AIPrompt.getAll();
      
      // 分类提示词
      var systemPrompts = prompts.filter(function(p) { return p.prompt_type === 'system'; });
      var functionPrompts = prompts.filter(function(p) { return p.prompt_type === 'function'; });
      
      res.render('admin/prompts', {
        message: req.query.message || null,
        systemPrompts: systemPrompts,
        functionPrompts: functionPrompts
      });
    } catch (error) {
      Logger.error('获取提示词列表失败:', error);
      res.render('admin/prompts', {
        message: '错误: ' + error.message,
        systemPrompts: [],
        functionPrompts: []
      });
    }
  }

  /**
   * 显示编辑提示词页面
   */
  static async showEditPromptPage(req, res) {
    try {
      var id = parseInt(req.params.id);
      var prompt = await AIPrompt.getById(id);
      
      if (!prompt) {
        return res.redirect('/admin/prompts?message=' + encodeURIComponent('提示词不存在'));
      }
      
      res.render('admin/prompt-edit', {
        message: null,
        prompt: prompt
      });
    } catch (error) {
      Logger.error('获取提示词详情失败:', error);
      res.redirect('/admin/prompts?message=' + encodeURIComponent('错误: ' + error.message));
    }
  }

  /**
   * 更新提示词
   */
  static async updatePrompt(req, res) {
    try {
      var id = parseInt(req.params.id);
      var data = {
        prompt_name: req.body.prompt_name,
        prompt_template: req.body.prompt_template,
        is_active: req.body.is_active === '1'
      };
      
      await AIPrompt.update(id, data);
      
      Logger.info('提示词更新成功: ID=' + id);
      res.redirect('/admin/prompts?message=' + encodeURIComponent('✅ 更新成功'));
    } catch (error) {
      Logger.error('更新提示词失败:', error);
      res.redirect('/admin/prompts?message=' + encodeURIComponent('错误: ' + error.message));
    }
  }

  /**
   * 切换提示词启用状态
   */
  static async togglePrompt(req, res) {
    try {
      var id = parseInt(req.params.id);
      await AIPrompt.toggleActive(id);
      
      Logger.info('提示词状态切换成功: ID=' + id);
      res.redirect('/admin/prompts?message=' + encodeURIComponent('✅ 状态已更新'));
    } catch (error) {
      Logger.error('切换提示词状态失败:', error);
      res.redirect('/admin/prompts?message=' + encodeURIComponent('错误: ' + error.message));
    }
  }
}

module.exports = AdminController;
