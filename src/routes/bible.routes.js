const express = require('express');
const BibleController = require('../controllers/bible.controller');

const router = express.Router();

// 首页 - 显示所有经卷
router.get('/', BibleController.showIndex);

// 显示某经卷的章节
router.get('/book/:bookId', BibleController.showBook);

// 显示某章的经文
router.get('/book/:bookId/chapter/:chapter', BibleController.showChapter);

module.exports = router;
