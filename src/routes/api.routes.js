const express = require('express');
const BibleService = require('../services/bible.service');

const router = express.Router();

/**
 * API 路由 - 返回 JSON 数据
 * 用于前端 Hash 路由动态加载内容
 */

/**
 * GET /api/books
 * 获取所有经卷列表
 */
router.get('/books', async (req, res, next) => {
  try {
    const books = await BibleService.getAllBooks();
    res.json({
      success: true,
      data: books
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/book/:bookId
 * 获取经卷的章节列表
 */
router.get('/book/:bookId', async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    const chapters = await BibleService.getBookChapters(bookId);
    res.json({
      success: true,
      data: chapters
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/verses
 * 获取某章的经文
 * Query: bookId, chapter
 */
router.get('/verses', async (req, res, next) => {
  try {
    const bookId = Number(req.query.bookId);
    const chapter = Number(req.query.chapter);
    const verses = await BibleService.getChapterVerses(bookId, chapter);
    res.json({
      success: true,
      data: verses
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/navigation
 * 获取章节导航信息（上一章/下一章）
 * Query: bookId, chapter
 */
router.get('/navigation', async (req, res, next) => {
  try {
    const bookId = Number(req.query.bookId);
    const chapter = Number(req.query.chapter);
    const navigation = await BibleService.getChapterNavigation(bookId, chapter);
    res.json({
      success: true,
      data: navigation
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
