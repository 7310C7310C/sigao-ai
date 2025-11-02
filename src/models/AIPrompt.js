const { query } = require('./database');

/**
 * AI 提示词模型
 */
class AIPrompt {
  /**
   * 获取系统提示词（全局生效）
   * @param {string} lang - 语言代码
   * @returns {Promise<Object|null>}
   */
  static async getSystemPrompt(lang) {
    if (!lang) lang = 'zh';
    var result = await query(
      'SELECT * FROM ai_prompts WHERE prompt_type = ? AND lang = ? AND is_active = 1 ORDER BY order_index ASC LIMIT 1',
      ['system', lang]
    );
    var rows = result[0]; // mysql2 returns [rows, fields]
    return rows[0] || null;
  }

  /**
   * 获取功能提示词（按类型）
   * @param {string} functionType - 功能类型（summary/history/saints/prayer）
   * @param {string} lang - 语言代码
   * @returns {Promise<Object|null>}
   */
  static async getFunctionPrompt(functionType, lang) {
    if (!lang) lang = 'zh';
    var result = await query(
      'SELECT * FROM ai_prompts WHERE prompt_type = ? AND function_type = ? AND lang = ? AND is_active = 1 LIMIT 1',
      ['function', functionType, lang]
    );
    var rows = result[0]; // mysql2 returns [rows, fields]
    return rows[0] || null;
  }

    /**
   * 获取所有启用的功能提示词（经文页底部按钮用）
   * @param {string} lang - 语言代码
   * @returns {Promise<Array>}
   */
  static async getActiveFunctions(lang) {
    if (!lang) lang = 'zh';
    var result = await query(
      'SELECT function_type, prompt_name FROM ai_prompts WHERE prompt_type = ? AND lang = ? AND is_active = 1 ORDER BY order_index ASC',
      ['function', lang]
    );
    return result[0]; // mysql2 returns [rows, fields]
  }

    /**
   * 构建完整的消息数组（系统提示词 + 功能提示词）
   * @param {string} functionType - 功能类型 (summary/history/saints/prayer)
   * @param {object} variables - 变量替换对象 {verses, chapter, book, chapter_num}
   * @param {string} lang - 语言代码 (默认 'zh')
   * @returns {Promise<Array>} - [{role: 'system', content: '...'}, {role: 'user', content: '...'}]
   */
  static async buildMessages(functionType, variables, lang = 'zh') {
    var messages = [];
    
    try {
      // 1. 添加 system prompt
      var systemPrompt = await this.getSystemPrompt(lang);
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt.prompt_template
        });
      }
      
      // 2. 添加 function prompt（替换模板变量）
      var functionPrompt = await this.getFunctionPrompt(functionType, lang);
      if (functionPrompt && functionPrompt.prompt_template) {
        var content = functionPrompt.prompt_template;
        
        // 替换 {verses}, {chapter} 等占位符
        if (variables) {
          for (var key in variables) {
            if (variables.hasOwnProperty(key) && variables[key]) {
              var placeholder = '{' + key + '}';
              var value = String(variables[key]);
              content = content.replace(new RegExp(placeholder, 'g'), value);
            }
          }
        }
        
        messages.push({
          role: 'user',
          content: content
        });
      }
    } catch (error) {
      console.error('构建消息失败:', error);
      throw error;
    }
    
    return messages;
  }

  /**
   * 后台管理：获取所有提示词
   * @returns {Promise<Array>}
   */
  static async getAll() {
    var result = await query('SELECT * FROM ai_prompts ORDER BY prompt_type DESC, order_index ASC');
    return result[0]; // mysql2 returns [rows, fields]
  }

  /**
   * 后台管理：根据ID获取提示词
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    var result = await query('SELECT * FROM ai_prompts WHERE id = ?', [id]);
    var rows = result[0]; // mysql2 returns [rows, fields]
    return rows[0] || null;
  }

  /**
   * 后台管理：更新提示词
   * @param {number} id
   * @param {Object} data - { prompt_template, prompt_name, is_active }
   * @returns {Promise}
   */
  static async update(id, data) {
    var fields = [];
    var values = [];
    
    if (data.prompt_name !== undefined) {
      fields.push('prompt_name = ?');
      values.push(data.prompt_name);
    }
    
    if (data.prompt_template !== undefined) {
      fields.push('prompt_template = ?');
      values.push(data.prompt_template);
    }
    
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    
    if (fields.length === 0) {
      throw new Error('没有要更新的字段');
    }
    
    fields.push('updated_at = NOW()');
    values.push(id);
    
    var sql = 'UPDATE ai_prompts SET ' + fields.join(', ') + ' WHERE id = ?';
    return query(sql, values);
  }

  /**
   * 后台管理：切换启用状态
   * @param {number} id
   * @returns {Promise}
   */
  static async toggleActive(id) {
    var sql = 'UPDATE ai_prompts SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?';
    return query(sql, [id]);
  }

  /**
   * 后台管理：创建新提示词
   * @param {Object} data - { prompt_key, prompt_name, prompt_type, prompt_template, function_type, lang, order_index }
   * @returns {Promise}
   */
  static async create(data) {
    var sql = 'INSERT INTO ai_prompts (prompt_key, prompt_name, prompt_type, prompt_template, function_type, lang, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)';
    var values = [
      data.prompt_key,
      data.prompt_name,
      data.prompt_type || 'function',
      data.prompt_template,
      data.function_type || null,
      data.lang || 'zh',
      data.order_index || 0
    ];
    return query(sql, values);
  }

  /**
   * 后台管理：删除提示词
   * @param {number} id
   * @returns {Promise}
   */
  static async delete(id) {
    return query('DELETE FROM ai_prompts WHERE id = ?', [id]);
  }
}

module.exports = AIPrompt;
