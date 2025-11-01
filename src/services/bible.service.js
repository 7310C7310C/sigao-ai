const Book = require('../models/Book');
const Verse = require('../models/Verse');

/**
 * 圣经相关服务
 */
class BibleService {
  /**
   * 获取所有经卷
   */
  static async getAllBooks() {
    return await Book.findAll();
  }

  /**
   * 获取经卷的所有章节
   */
  static async getBookChapters(bookId) {
    return await Verse.getChaptersByBook(bookId);
  }

  /**
   * 获取某章的所有经文
   */
  static async getChapterVerses(bookId, chapter) {
    return await Verse.findByBookAndChapter(bookId, chapter);
  }
}

module.exports = BibleService;
