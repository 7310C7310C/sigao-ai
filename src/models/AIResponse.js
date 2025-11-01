const { query } = require('./database');

/**
 * AI 响应模型（预留）
 */
class AIResponse {
  /**
   * 清空 AI 响应缓存表
   */
  static async truncate() {
    await query('TRUNCATE TABLE ai_responses_cache');
  }
}

module.exports = AIResponse;
