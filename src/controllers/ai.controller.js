/**
 * AI Controller
 * 处理 AI 辅助功能请求
 */

var MagisteriumService = require('../services/ai/magisterium.service');
var BibleService = require('../services/bible.service');
var AIResponse = require('../models/AIResponse');
var Logger = require('../utils/logger');

var AIController = {
    /**
     * 生成 AI 内容（带数据库缓存）
     * POST /api/ai/generate
     * Body: { function_type, book_id, chapter, lang, force_regenerate }
     */
    generateContent: function(req, res) {
        try {
            var functionType = req.body.function_type;
            var bookId = req.body.book_id;
            var chapter = parseInt(req.body.chapter, 10);
            var lang = req.body.lang || 'zh';
            var forceRegenerate = req.body.force_regenerate === true;
            
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
                chapter: chapter,
                forceRegenerate: forceRegenerate
            });
            
            // 1. 检查数据库缓存（除非强制重新生成）
            if (!forceRegenerate) {
                AIResponse.findCached(bookId, chapter, functionType, lang)
                    .then(function(cached) {
                        if (cached) {
                            Logger.info('使用数据库缓存', {
                                functionType: functionType,
                                bookId: bookId,
                                chapter: chapter
                            });
                            
                            res.setHeader('Content-Type', 'application/json; charset=utf-8');
                            return res.json({
                                success: true,
                                data: cached,
                                cached: true
                            });
                        }
                        
                        // 无缓存，继续生成
                        generateAndCache();
                    })
                    .catch(function(err) {
                        Logger.error('查询缓存失败', { error: err.message });
                        // 缓存查询失败，继续生成
                        generateAndCache();
                    });
            } else {
                // 强制重新生成
                generateAndCache();
            }
            
            // 生成新内容并缓存
            function generateAndCache() {
                var versesText = '';
                var bookName = '';
                
                // 2. 获取经文内容
                BibleService.getChapter(bookId, chapter)
                    .then(function(result) {
                        if (!result.verses || result.verses.length === 0) {
                            return res.status(404).json({
                                success: false,
                                message: '未找到该章节的经文'
                            });
                        }
                        
                        // 保存经文文本用于缓存
                        versesText = result.verses.map(function(v) {
                            var ref = v.verse_ref ? v.verse_ref + ' ' : '';
                            return ref + v.text;
                        }).join('\n');
                        
                        bookName = result.bookName;
                        
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
                        var responseData = {
                            content: aiResult.content,
                            citations: aiResult.citations,
                            related_questions: aiResult.related_questions
                        };
                        
                        // 4. 保存到数据库缓存
                        return AIResponse.saveCache(
                            bookId,
                            chapter,
                            functionType,
                            lang,
                            responseData,
                            versesText,
                            30 // 缓存 30 天
                        ).then(function() {
                            return responseData;
                        }).catch(function(cacheErr) {
                            // 缓存保存失败不影响返回结果
                            Logger.error('保存缓存失败', { error: cacheErr.message });
                            return responseData;
                        });
                    })
                    .then(function(responseData) {
                        // 5. 返回结果（强制设置 UTF-8 编码）
                        res.setHeader('Content-Type', 'application/json; charset=utf-8');
                        res.json({
                            success: true,
                            data: responseData,
                            cached: false
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
            }
        } catch (err) {
            Logger.error('处理 AI 请求异常', { error: err.message });
            res.status(500).json({
                success: false,
                message: '服务器错误：' + err.message
            });
        }
    },

    /**
     * 生成 AI 内容（流式响应）
     * GET /api/ai/generate-stream
     * Query: function_type, book_id, chapter, lang, force_regenerate
     */
    generateContentStream: function(req, res) {
        try {
            var functionType = req.query.function_type;
            var bookId = parseInt(req.query.book_id, 10);
            var chapter = parseInt(req.query.chapter, 10);
            var lang = req.query.lang || 'zh';
            var forceRegenerate = req.query.force_regenerate === 'true';
            
            // 参数验证
            if (!functionType || !bookId || !chapter) {
                return res.status(400).json({
                    success: false,
                    message: '缺少必需参数'
                });
            }
            
            var validFunctions = ['summary', 'history', 'saints', 'prayer'];
            if (validFunctions.indexOf(functionType) === -1) {
                return res.status(400).json({
                    success: false,
                    message: '无效的功能类型'
                });
            }
            
            Logger.info('AI 流式生成请求', {
                functionType: functionType,
                bookId: bookId,
                chapter: chapter,
                forceRegenerate: forceRegenerate
            });
            
            // 设置 SSE 响应头
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲
            
            // 立即发送连接成功消息（让前端知道已连接）
            res.write('data: ' + JSON.stringify({
                type: 'connected',
                message: '正在生成内容...'
            }) + '\n\n');
            
            // 1. 如果不是强制重新生成，先检查缓存
            if (!forceRegenerate) {
                AIResponse.findCached(bookId, chapter, functionType, lang)
                    .then(function(cached) {
                        if (cached) {
                            Logger.info('使用数据库缓存（流式返回）', {
                                functionType: functionType,
                                bookId: bookId,
                                chapter: chapter
                            });
                            
                            // 将缓存的内容以流式方式返回（逐字发送，前端有打字机效果）
                            var content = cached.content || '';
                            var citations = cached.citations || [];
                            var chunkSize = 10; // 每次发送10个字符（更流畅）
                            var index = 0;
                            
                            var sendChunk = function() {
                                if (index < content.length) {
                                    var chunk = content.substring(index, Math.min(index + chunkSize, content.length));
                                    res.write('data: ' + JSON.stringify({
                                        type: 'chunk',
                                        content: chunk
                                    }) + '\n\n');
                                    
                                    index += chunkSize;
                                    setTimeout(sendChunk, 10); // 10ms 延迟（更快响应，前端控制打字速度）
                                } else {
                                    // 发送完成信号
                                    res.write('data: ' + JSON.stringify({
                                        type: 'done',
                                        citations: citations,
                                        cached: true
                                    }) + '\n\n');
                                    res.end();
                                }
                            };
                            
                            sendChunk();
                            return;
                        }
                        
                        // 无缓存，开始流式生成
                        generateStreamAndCache();
                    })
                    .catch(function(err) {
                        Logger.error('查询缓存失败', { error: err.message });
                        generateStreamAndCache();
                    });
            } else {
                // 强制重新生成 - 先删除旧缓存
                Logger.info('强制重新生成，删除旧缓存', {
                    functionType: functionType,
                    bookId: bookId,
                    chapter: chapter
                });
                
                AIResponse.deleteCache(bookId, chapter, functionType, lang)
                    .then(function() {
                        Logger.info('旧缓存已删除');
                        generateStreamAndCache();
                    })
                    .catch(function(err) {
                        Logger.warn('删除旧缓存失败', { error: err.message });
                        // 即使删除失败也继续生成
                        generateStreamAndCache();
                    });
            }
            
            function generateStreamAndCache() {
                var versesText = '';
                var accumulatedContent = '';
                
                // 2. 获取经文内容
                BibleService.getChapter(bookId, chapter)
                    .then(function(result) {
                        if (!result.verses || result.verses.length === 0) {
                            res.write('data: ' + JSON.stringify({
                                type: 'error',
                                message: '未找到该章节的经文'
                            }) + '\n\n');
                            return res.end();
                        }
                        
                        versesText = result.verses.map(function(v) {
                            var ref = v.verse_ref ? v.verse_ref + ' ' : '';
                            return ref + v.text;
                        }).join('\n');
                        
                        var variables = {
                            verses: versesText,
                            chapter: result.bookName + ' 第 ' + chapter + ' 章',
                            book: result.bookName,
                            chapter_num: chapter.toString()
                        };
                        
                        // 发送"正在连接 API"消息
                        res.write('data: ' + JSON.stringify({
                            type: 'connecting',
                            message: '正在连接 AI 服务...'
                        }) + '\n\n');
                        
                        var firstChunkReceived = false;
                        var heartbeatTimer = null;
                        var heartbeatCount = 0;
                        
                        // 心跳机制：每3秒发送一次进度更新
                        heartbeatTimer = setInterval(function() {
                            heartbeatCount++;
                            var message = '正在等待 AI 响应...';
                            if (heartbeatCount >= 3) {
                                message = '正在深度分析经文...';
                            }
                            if (heartbeatCount >= 6) {
                                message = '正在整理内容...';
                            }
                            res.write('data: ' + JSON.stringify({
                                type: 'heartbeat',
                                message: message,
                                elapsed: heartbeatCount * 3
                            }) + '\n\n');
                        }, 3000);
                        
                        // 3. 调用流式 AI 服务
                        MagisteriumService.generateStream(
                            functionType,
                            variables,
                            lang,
                            // onChunk - 接收到内容片段
                            function(content) {
                                // 第一个 chunk 到达时记录日志并清除心跳
                                if (!firstChunkReceived) {
                                    firstChunkReceived = true;
                                    if (heartbeatTimer) {
                                        clearInterval(heartbeatTimer);
                                        heartbeatTimer = null;
                                    }
                                    Logger.info('首个内容片段已到达', { functionType: functionType });
                                }
                                
                                accumulatedContent += content;
                                res.write('data: ' + JSON.stringify({
                                    type: 'chunk',
                                    content: content
                                }) + '\n\n');
                            },
                            // onComplete - 生成完成
                            function(citations, relatedQuestions) {
                                // 清除心跳
                                if (heartbeatTimer) {
                                    clearInterval(heartbeatTimer);
                                    heartbeatTimer = null;
                                }
                                
                                var responseData = {
                                    content: accumulatedContent,
                                    citations: citations,
                                    related_questions: relatedQuestions
                                };
                                
                                // 保存到数据库缓存
                                AIResponse.saveCache(
                                    bookId,
                                    chapter,
                                    functionType,
                                    lang,
                                    responseData,
                                    versesText,
                                    30
                                ).then(function() {
                                    Logger.info('流式响应已缓存', {
                                        functionType: functionType,
                                        contentLength: accumulatedContent.length
                                    });
                                }).catch(function(cacheErr) {
                                    Logger.error('保存缓存失败', { error: cacheErr.message });
                                });
                                
                                // 发送完成信号
                                res.write('data: ' + JSON.stringify({
                                    type: 'done',
                                    citations: citations,
                                    cached: false
                                }) + '\n\n');
                                res.end();
                            },
                            // onError - 错误处理
                            function(err) {
                                // 清除心跳
                                if (heartbeatTimer) {
                                    clearInterval(heartbeatTimer);
                                    heartbeatTimer = null;
                                }
                                
                                Logger.error('AI 流式生成失败', {
                                    error: err.message,
                                    functionType: functionType
                                });
                                
                                res.write('data: ' + JSON.stringify({
                                    type: 'error',
                                    message: err.message || 'AI 生成失败'
                                }) + '\n\n');
                                res.end();
                            }
                        );
                    })
                    .catch(function(err) {
                        Logger.error('获取经文失败', { error: err.message });
                        res.write('data: ' + JSON.stringify({
                            type: 'error',
                            message: '获取经文失败：' + err.message
                        }) + '\n\n');
                        res.end();
                    });
            }
        } catch (err) {
            Logger.error('处理流式请求异常', { error: err.message });
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: '服务器错误：' + err.message
                });
            }
        }
    }
};

module.exports = AIController;
