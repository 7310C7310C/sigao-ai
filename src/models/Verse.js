const { query, execute } = require('./database');

/**
 * 经文模型
 */
class Verse {
  /**
   * 根据经卷和章节获取经文
   */
  static async findByBookAndChapter(bookId, chapter) {
    const rows = await execute(
      `SELECT v.*, b.name_cn as book_name 
       FROM verses v 
       LEFT JOIN books b ON v.book_id = b.id 
       WHERE v.book_id = ? AND v.chapter = ? 
       ORDER BY v.line_index`,
      [bookId, chapter]
    );
    return rows;
  }

  /**
   * 获取某经卷的所有章节
   */
  static async getChaptersByBook(bookId) {
    const rows = await execute(
      'SELECT DISTINCT chapter FROM verses WHERE book_id = ? ORDER BY chapter',
      [bookId]
    );
    return rows;
  }

  /**
   * 创建经文
   */
  static async create(verseData) {
    const { 
      translation_id, 
      book_id, 
      chapter, 
      verse_ref, 
      line_index, 
      type, 
      text, 
      content_hash, 
      original_row 
    } = verseData;

    const result = await execute(
      'INSERT INTO verses (translation_id, book_id, chapter, verse_ref, line_index, type, text, content_hash, original_row) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [translation_id, book_id, chapter, verse_ref, line_index, type, text, content_hash, original_row]
    );
    return result.insertId;
  }

  /**
   * 清空经文表
   */
  static async truncate() {
    await query('TRUNCATE TABLE verses');
  }

  /**
   * 根据文本内容搜索经文
   */
  static async searchByText(keyword, limit = 100) {
    // 确保 limit 是安全的整数
    const safeLimit = parseInt(limit) || 100;
    if (safeLimit < 1 || safeLimit > 1000) {
      throw new Error('Invalid limit value');
    }
    
    const rows = await execute(
      `SELECT v.id, v.book_id, v.chapter, v.verse_ref, v.text, v.line_index,
              b.name_cn as book_name, b.testament
       FROM verses v 
       LEFT JOIN books b ON v.book_id = b.id 
       WHERE v.text LIKE ? 
       ORDER BY b.order_index, v.chapter, v.line_index
       LIMIT ${safeLimit}`,
      [`%${keyword}%`]
    );
    return rows;
  }
}

module.exports = Verse;
