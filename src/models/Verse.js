const { query, execute } = require('./database');

/**
 * 经文模型
 */
class Verse {
  /**
   * 根据经卷和章节获取经文
   */
  static async findByBookAndChapter(bookId, chapter) {
    const [rows] = await execute(
      'SELECT * FROM verses WHERE book_id = ? AND chapter = ? ORDER BY line_index',
      [bookId, chapter]
    );
    return rows;
  }

  /**
   * 获取某经卷的所有章节
   */
  static async getChaptersByBook(bookId) {
    const [rows] = await execute(
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

    const [result] = await execute(
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
}

module.exports = Verse;
