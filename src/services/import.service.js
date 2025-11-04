const xlsx = require('xlsx');
const { getConnection } = require('../models/database');
const Translation = require('../models/Translation');
const Book = require('../models/Book');
const Verse = require('../models/Verse');
const AIResponse = require('../models/AIResponse');
const { slugify } = require('../utils/slugify');
const { generateContentHash } = require('../utils/hash');
const Logger = require('../utils/logger');

/**
 * 导入服务
 */
class ImportService {
  /**
   * 从 Excel 文件导入圣经数据
   */
  static async importFromExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    const conn = await getConnection();
    
    try {
      await conn.beginTransaction();
      Logger.info('开始导入数据...');

      // 清空现有数据
      await this.clearAllTables(conn);
      Logger.info('已清空所有表数据');

      // 创建译本
      const [trows] = await conn.execute(
        'INSERT INTO translations (code, name, lang) VALUES (?, ?, ?)',
        ['sigao_cn', '思高(简体)', 'zh']
      );
      const translationId = trows.insertId;
      Logger.info(`创建译本成功，ID: ${translationId}`);

      // 第一遍：处理经卷
      const bookMap = await this.processBooks(conn, rows);
      Logger.info(`处理了 ${bookMap.size} 本经卷`);

      // 第二遍：处理经文
      const verseCount = await this.processVerses(conn, rows, translationId, bookMap);
      Logger.info(`导入了 ${verseCount} 条经文`);

      await conn.commit();
      Logger.info('数据导入完成');
      
      return { success: true, rowCount: rows.length, verseCount };
    } catch (error) {
      await conn.rollback();
      Logger.error('导入失败:', error);
      throw error;
    } finally {
      await conn.release();
    }
  }

  /**
   * 清空所有表
   */
  static async clearAllTables(conn) {
    // 必须使用同一个连接来执行 TRUNCATE，否则 FOREIGN_KEY_CHECKS 设置无效
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    await conn.query('TRUNCATE TABLE ai_responses_cache');
    await conn.query('TRUNCATE TABLE verses');
    await conn.query('TRUNCATE TABLE books');
    await conn.query('TRUNCATE TABLE translations');
    await conn.query('SET FOREIGN_KEY_CHECKS=1');
  }

  /**
   * 处理经卷数据
   */
  static async processBooks(conn, rows) {
    const bookMap = new Map();
    
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const testament = r['约别'] || r['约别'] || '';
      const bookType = r['经卷类别'] || r['经卷类别'] || '';
      const bookName = r['卷名'] || r['卷名'] || r['书卷'] || '';

      if (!bookName) continue;

      let bookCode = bookMap.get(bookName);
      if (!bookCode) {
        bookCode = slugify(bookName) || `book_${bookMap.size + 1}`;
        const [bres] = await conn.execute(
          'INSERT INTO books (code, name_cn, book_type, testament, order_index) VALUES (?, ?, ?, ?, ?)',
          [bookCode, bookName, bookType || null, testament || '新约', bookMap.size + 1]
        );
        bookMap.set(bookName, bres.insertId);
        bookMap.set(bookName + '_id', bres.insertId);
      }
    }
    
    return bookMap;
  }

  /**
   * 处理经文数据
   */
  static async processVerses(conn, rows, translationId, bookMap) {
    const lastLineIndex = {};
    let verseCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const bookName = r['卷名'] || r['卷名'] || r['书卷'] || '';
      const chapterRaw = String(r['章'] || '').trim();
      const verseRaw = String(r['节'] || '').trim();
      const text = String(r['经文内容'] || r['经文内容'] || '').trim();

      if (!bookName) continue;

      const bookId = bookMap.get(bookName + '_id');
      let chapter = parseInt(chapterRaw, 10);
      if (!Number.isFinite(chapter)) chapter = 0;

      const verse_ref = verseRaw === '' ? null : verseRaw;
      const key = `${translationId}_${bookId}_${chapter}`;
      lastLineIndex[key] = (lastLineIndex[key] || 0) + 1;
      const line_index = lastLineIndex[key];
      const content_hash = generateContentHash(text);
      const type = verse_ref ? 'verse' : 'note';

      await conn.execute(
        'INSERT INTO verses (translation_id, book_id, chapter, verse_ref, line_index, type, text, content_hash, original_row) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [translationId, bookId, chapter, verse_ref, line_index, type, text, content_hash, i + 1]
      );
      
      verseCount++;
    }

    return verseCount;
  }
}

module.exports = ImportService;