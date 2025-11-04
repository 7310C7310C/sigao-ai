const ImportService = require('../services/import.service');
const AIPrompt = require('../models/AIPrompt');
const AIResponse = require('../models/AIResponse');
const Logger = require('../utils/logger');
const flash = require('../utils/flash');

/**
 * 管理后台控制器
 */
class AdminController {
  /**
   * 显示管理页面（仅按钮导航）
   */
  static async showAdminPage(req, res) {
    res.render('admin/index');
  }

  /**
   * 显示圣经导入页面
   */
  static async showImportPage(req, res) {
    res.render('admin/import');
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
      
      flash.flashSuccess(res, `成功导入 ${result.rowCount} 行数据，共 ${result.verseCount} 条经文`);
      res.redirect('/admin/import');
    } catch (error) {
      Logger.error('上传处理失败:', error);
      flash.flashError(res, `错误: ${error.message}`);
      res.redirect('/admin/import');
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
        systemPrompts: systemPrompts,
        functionPrompts: functionPrompts
      });
    } catch (error) {
      Logger.error('获取提示词列表失败:', error);
      flash.flashError(res, '错误: ' + error.message);
      res.render('admin/prompts', {
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
        flash.flashError(res, '提示词不存在');
        return res.redirect('/admin/prompts');
      }
      
      res.render('admin/prompt-edit', {
        prompt: prompt
      });
    } catch (error) {
      Logger.error('获取提示词详情失败:', error);
      flash.flashError(res, '错误: ' + error.message);
      res.redirect('/admin/prompts');
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
      flash.flashSuccess(res, '✅ 更新成功');
      res.redirect('/admin/prompts');
    } catch (error) {
      Logger.error('更新提示词失败:', error);
      flash.flashError(res, '错误: ' + error.message);
      res.redirect('/admin/prompts');
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
      flash.flashSuccess(res, '✅ 状态已更新');
      res.redirect('/admin/prompts');
    } catch (error) {
      Logger.error('切换提示词状态失败:', error);
      flash.flashError(res, '错误: ' + error.message);
      res.redirect('/admin/prompts');
    }
  }
  
  /**
   * 显示 AI 结果管理页面
   */
  static async showAIResultsPage(req, res) {
    try {
      var results = await AIResponse.getAllForAdmin();
      var stats = await AIResponse.getStats();
      
      res.render('admin/ai-results', {
        results: results,
        stats: stats
      });
    } catch (error) {
      Logger.error('获取 AI 结果列表失败:', error);
      flash.flashError(res, '错误: ' + error.message);
      res.render('admin/ai-results', {
        results: [],
        stats: { total: 0, summary: 0, history: 0, saints: 0, prayer: 0 }
      });
    }
  }
  
  /**
   * 删除单条 AI 结果
   */
  static async deleteAIResult(req, res) {
    try {
      var id = parseInt(req.params.id);
      var deleted = await AIResponse.deleteById(id);
      
      if (deleted > 0) {
        Logger.info('AI 结果删除成功: ID=' + id);
        flash.flashSuccess(res, '✅ 删除成功');
      } else {
        flash.flashWarning(res, '记录不存在');
      }
      res.redirect('/admin/ai-results');
    } catch (error) {
      Logger.error('删除 AI 结果失败:', error);
      flash.flashError(res, '错误: ' + error.message);
      res.redirect('/admin/ai-results');
    }
  }
  
  /**
   * 清空所有 AI 结果缓存
   */
  static async clearAllAIResults(req, res) {
    try {
      await AIResponse.truncate();
      
      Logger.info('AI 结果缓存已清空');
      flash.flashSuccess(res, '✅ 已清空所有缓存');
      res.redirect('/admin/ai-results');
    } catch (error) {
      Logger.error('清空 AI 结果缓存失败:', error);
      flash.flashError(res, '错误: ' + error.message);
      res.redirect('/admin/ai-results');
    }
  }

  /**
   * 查看 AI 结果的原始 API 数据（JSON 格式）
   */
  static async viewApiRawData(req, res) {
    try {
      var id = parseInt(req.params.id);
      var data = await AIResponse.getApiRawData(id);
      
      if (!data) {
        return res.status(404).json({
          error: '记录不存在或无 API 原始数据'
        });
      }
      
      // 设置响应头确保正确显示 JSON
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      // 返回格式化的 JSON 数据
      res.send(JSON.stringify({
        id: data.id,
        book_id: data.book_id,
        chapter: data.chapter,
        function_type: data.function_type,
        created_at: data.created_at,
        api_request: data.request,
        api_response: data.response
      }, null, 2));
    } catch (error) {
      Logger.error('获取 API 原始数据失败:', error);
      res.status(500).json({
        error: error.message
      });
    }
  }
}

module.exports = AdminController;
