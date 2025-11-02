const BibleService = require('../services/bible.service');

/**
 * 圣经内容控制器
 */
class BibleController {
  /**
   * 显示首页 - 经卷列表
   */
  static async showIndex(req, res, next) {
    try {
      const books = await BibleService.getAllBooks();
      res.render('bible/index', { books });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 显示经卷的章节列表
   */
  static async showBook(req, res, next) {
    try {
      const bookId = Number(req.params.bookId);
      const chapters = await BibleService.getBookChapters(bookId);
      res.render('bible/book', { chapters, bookId });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 显示某章的经文
   */
  static async showChapter(req, res, next) {
    try {
      const bookId = Number(req.params.bookId);
      const chapter = Number(req.params.chapter);
      const verses = await BibleService.getChapterVerses(bookId, chapter);
      res.render('bible/chapter', { verses, bookId, chapter });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 搜索圣经内容
   */
  static async search(req, res, next) {
    try {
      const keyword = req.query.q || req.query.keyword || '';
      const limit = Number(req.query.limit) || 100;
      
      const results = await BibleService.search(keyword, limit);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BibleController;
