const { query } = require('./database');
const crypto = require('crypto');

/**
 * AI 响应模型
 */
class AIResponse {
  /**
   * 查询缓存的 AI 响应
   * @param {number} bookId - 书卷 ID
   * @param {number} chapter - 章节编号
   * @param {string} functionType - 功能类型
   * @param {string} lang - 语言代码
   * @returns {Promise<object|null>} - 缓存的响应数据或 null
   */
  static async findCached(bookId, chapter, functionType, lang) {
    var sql = `
      SELECT response_json 
      FROM ai_responses_cache 
      WHERE book_id = ? 
        AND chapter = ? 
        AND function_type = ? 
        AND lang = ?
        AND (ttl_expires_at IS NULL OR ttl_expires_at > NOW())
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    var params = [bookId, chapter, functionType, lang || 'zh'];
    
    var rows = await query(sql, params);
    
    if (rows && rows.length > 0) {
      var responseJson = rows[0].response_json;
      
      // MySQL JSON 类型可能返回字符串或对象
      if (typeof responseJson === 'string') {
        try {
          responseJson = JSON.parse(responseJson);
        } catch (e) {
          console.error('[AIResponse] JSON 解析失败:', e.message);
          return null;
        }
      }
      
      if (responseJson && responseJson.content) {
        return responseJson;
      }
    }
    
    return null;
  }
  
  /**
   * 保存 AI 响应到缓存
   * @param {number} bookId - 书卷 ID
   * @param {number} chapter - 章节编号
   * @param {string} functionType - 功能类型
   * @param {string} lang - 语言代码
   * @param {object} responseData - 响应数据 { content, citations, related_questions }
   * @param {string} inputText - 输入文本（用于生成哈希）
   * @param {number} ttlDays - 缓存有效期（天数，默认 30 天）
   * @returns {Promise<number>} - 插入的 ID
   */
  static async saveCache(bookId, chapter, functionType, lang, responseData, inputText, ttlDays) {
    // 生成输入哈希（用于去重和版本控制）
    var inputHash = crypto.createHash('sha256').update(inputText || '').digest('hex');
    
    // 计算过期时间
    var ttlExpires = null;
    if (ttlDays && ttlDays > 0) {
      var expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ttlDays);
      ttlExpires = expiresAt.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    var sql = `
      INSERT INTO ai_responses_cache 
        (book_id, chapter, function_type, lang, input_hash, response_json, ttl_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    var result = await query(sql, [
      bookId,
      chapter,
      functionType,
      lang || 'zh',
      inputHash,
      JSON.stringify(responseData),
      ttlExpires
    ]);
    
    return result.insertId;
  }
  
  /**
   * 删除指定的缓存
   * @param {number} bookId - 书卷 ID
   * @param {number} chapter - 章节编号
   * @param {string} functionType - 功能类型
   * @returns {Promise<number>} - 删除的行数
   */
  static async deleteCache(bookId, chapter, functionType) {
    var sql = `
      DELETE FROM ai_responses_cache 
      WHERE book_id = ? AND chapter = ? AND function_type = ?
    `;
    
    var result = await query(sql, [bookId, chapter, functionType]);
    return result.affectedRows;
  }
  
  /**
   * 清空 AI 响应缓存表
   */
  static async truncate() {
    await query('TRUNCATE TABLE ai_responses_cache');
  }
}

module.exports = AIResponse;
