/**
 * AI Controller
 * 处理 AI 辅助功能请求
 */

var MagisteriumService = require('../services/ai/magisterium.service');
var BibleService = require('../services/bible.service');
var Logger = require('../utils/logger');

var AIController = {
    /**
     * 生成 AI 内容
     * POST /api/ai/generate
     * Body: { function_type, book_id, chapter, lang }
     */
    generateContent: function(req, res) {
        try {
            var functionType = req.body.function_type;
            var bookId = req.body.book_id;
            var chapter = parseInt(req.body.chapter, 10);
            var lang = req.body.lang || 'zh';
            
            // 参数验证
            if (!functionType || !bookId || !chapter) {
                return res.status(400).json({
                    success: false,
                    message: '缺少必需参数：function_type, book_id, chapter'
                });
            }
            
            var validFunctions = ['summary', 'history', 'saints', 'prayer'];
            if (validFunctions.indexOf(functionType) === -1) {
                return res.status(400).json({
                    success: false,
                    message: '无效的功能类型：' + functionType
                });
            }
            
            Logger.info('AI 生成请求', {
                functionType: functionType,
                bookId: bookId,
                chapter: chapter
            });
            
            // 1. 获取经文内容
            BibleService.getChapter(bookId, chapter)
                .then(function(result) {
                    if (!result.verses || result.verses.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: '未找到该章节的经文'
                        });
                    }
                    
                    // 2. 构建变量对象
                    var versesText = result.verses.map(function(v) {
                        var ref = v.verse_ref ? v.verse_ref + ' ' : '';
                        return ref + v.text;
                    }).join('\n');
                    
                    var variables = {
                        verses: versesText,
                        chapter: result.bookName + ' 第 ' + chapter + ' 章',
                        book: result.bookName,
                        chapter_num: chapter.toString()
                    };
                    
                    // 3. 调用 AI 服务
                    return MagisteriumService.generate(functionType, variables, lang);
                })
                .then(function(aiResult) {
                    // 4. 返回结果（强制设置 UTF-8 编码）
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.json({
                        success: true,
                        data: {
                            content: aiResult.content,
                            citations: aiResult.citations,
                            related_questions: aiResult.related_questions
                        }
                    });
                })
                .catch(function(err) {
                    Logger.error('AI 生成失败', {
                        error: err.message,
                        functionType: functionType
                    });
                    
                    res.status(500).json({
                        success: false,
                        message: err.message || 'AI 生成失败'
                    });
                });
        } catch (err) {
            Logger.error('处理 AI 请求异常', { error: err.message });
            res.status(500).json({
                success: false,
                message: '服务器错误：' + err.message
            });
        }
    }
};

module.exports = AIController;
