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
    const chapters = await Verse.getChaptersByBook(bookId);
    const book = await Book.findById(bookId);
    
    // 为每个章节添加书卷名
    if (book && chapters.length > 0) {
      chapters.forEach(function(c) {
        c.book_name = book.name_cn;
      });
    }
    
    return chapters;
  }

  /**
   * 获取某章的所有经文
   */
  static async getChapterVerses(bookId, chapter) {
    return await Verse.findByBookAndChapter(bookId, chapter);
  }

  /**
   * 获取某章的完整信息（包含书卷名和经文）
   */
  static async getChapter(bookId, chapter) {
    const book = await Book.findById(bookId);
    const verses = await Verse.findByBookAndChapter(bookId, chapter);
    
    return {
      bookId: bookId,
      bookName: book ? book.name_cn : '',
      chapter: chapter,
      verses: verses
    };
  }

  /**
   * 获取章节导航信息（上一章/下一章）
   */
  static async getChapterNavigation(bookId, chapter) {
    const books = await Book.findAll();
    const currentBookIndex = books.findIndex(b => b.id === bookId);
    
    if (currentBookIndex === -1) {
      return { prev: null, next: null };
    }

    const currentBook = books[currentBookIndex];
    const chapters = await Verse.getChaptersByBook(bookId);
    const maxChapter = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter)) : 0;

    let prev = null;
    let next = null;

    // 上一章
    if (chapter > 1) {
      // 当前书卷的上一章
      prev = { bookId: bookId, chapter: chapter - 1, bookName: currentBook.name_cn };
    } else if (currentBookIndex > 0) {
      // 上一卷的最后一章
      const prevBook = books[currentBookIndex - 1];
      const prevChapters = await Verse.getChaptersByBook(prevBook.id);
      const prevMaxChapter = prevChapters.length > 0 ? Math.max(...prevChapters.map(c => c.chapter)) : 0;
      if (prevMaxChapter > 0) {
        prev = { bookId: prevBook.id, chapter: prevMaxChapter, bookName: prevBook.name_cn };
      }
    }

    // 下一章
    if (chapter < maxChapter) {
      // 当前书卷的下一章
      next = { bookId: bookId, chapter: chapter + 1, bookName: currentBook.name_cn };
    } else if (currentBookIndex < books.length - 1) {
      // 下一卷的第一章
      const nextBook = books[currentBookIndex + 1];
      const nextChapters = await Verse.getChaptersByBook(nextBook.id);
      if (nextChapters.length > 0) {
        next = { bookId: nextBook.id, chapter: 1, bookName: nextBook.name_cn };
      }
    }

    return { prev, next, currentBook: currentBook.name_cn, currentChapter: chapter };
  }
}

module.exports = BibleService;
