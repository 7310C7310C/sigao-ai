/**
 * Magisterium AI 服务
 * 调用官方 API 生成内容
 */

var https = require('https');
var AIPrompt = require('../../models/AIPrompt');
var Logger = require('../../utils/logger');

var MagisteriumService = {
    /**
     * 生成 AI 响应
     * @param {string} functionType - 功能类型 (summary/history/saints/prayer)
     * @param {object} variables - 变量替换对象 {verses, chapter, book, chapter_num}
     * @param {string} lang - 语言代码
     * @returns {Promise<object>} - { content, citations, related_questions }
     */
    generate: function(functionType, variables, lang) {
        return new Promise(function(resolve, reject) {
            // 1. 构建消息数组（系统提示词 + 功能提示词）
            AIPrompt.buildMessages(functionType, variables, lang)
                .then(function(messages) {
                    if (!messages || messages.length === 0) {
                        return reject(new Error('无法获取提示词模板'));
                    }
                    
                    // 2. 构建请求体
                    var requestBody = JSON.stringify({
                        model: 'magisterium-1',
                        messages: messages,
                        stream: false,
                        return_related_questions: false,
                        temperature: 1.2,  // 更高的随机性
                        top_p: 0.95  // 添加 top_p 参数
                    });
                    
                    // 3. 检查 API 密钥
                    var apiKey = process.env.MAGISTERIUM_API_KEY;
                    var apiUrl = process.env.MAGISTERIUM_API_URL || 'https://www.magisterium.com/api/v1/chat/completions';
                    
                    if (!apiKey) {
                        Logger.error('未配置 MAGISTERIUM_API_KEY');
                        return reject(new Error('未配置 API 密钥，请联系管理员'));
                    }
                    
                    Logger.info('调用 Magisterium API', {
                        functionType: functionType,
                        apiUrl: apiUrl,
                        messagesCount: messages.length
                    });
                    
                    // 4. 配置 HTTPS 请求
                    var options = {
                        hostname: 'www.magisterium.com',
                        port: 443,
                        path: '/api/v1/chat/completions',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + apiKey,
                            'Content-Length': Buffer.byteLength(requestBody)
                        },
                        timeout: 60000 // 60秒超时
                    };
                    
                    // 5. 发送请求
                    var req = https.request(options, function(res) {
                        var data = '';
                        
                        res.on('data', function(chunk) {
                            data += chunk;
                        });
                        
                        res.on('end', function() {
                            try {
                                var response = JSON.parse(data);
                                
                                // 检查响应格式
                                if (res.statusCode !== 200) {
                                    Logger.error('Magisterium API 错误', {
                                        status: res.statusCode,
                                        response: response
                                    });
                                    return reject(new Error(
                                        response.error || 'API 请求失败（' + res.statusCode + '）'
                                    ));
                                }
                                
                                // 提取内容
                                if (response.choices && 
                                    response.choices.length > 0 && 
                                    response.choices[0].message) {
                                    
                                    var result = {
                                        content: response.choices[0].message.content || '',
                                        citations: response.citations || [],
                                        related_questions: response.related_questions || []
                                    };
                                    
                                    Logger.info('AI 生成成功', {
                                        functionType: functionType,
                                        contentLength: result.content.length
                                    });
                                    
                                    resolve(result);
                                } else {
                                    Logger.error('响应格式错误', { response: response });
                                    reject(new Error('响应格式不正确'));
                                }
                            } catch (err) {
                                Logger.error('解析响应失败', { error: err.message });
                                reject(new Error('解析 AI 响应失败：' + err.message));
                            }
                        });
                    });
                    
                    req.on('error', function(err) {
                        Logger.error('API 请求失败', { error: err.message });
                        reject(new Error('网络错误：' + err.message));
                    });
                    
                    req.on('timeout', function() {
                        req.destroy();
                        reject(new Error('请求超时，请稍后重试'));
                    });
                    
                    req.write(requestBody);
                    req.end();
                })
                .catch(function(err) {
                    Logger.error('构建消息失败', { error: err.message });
                    reject(err);
                });
        });
    },

    /**
     * 生成 AI 响应（流式）
     * @param {string} functionType - 功能类型
     * @param {object} variables - 变量替换对象
     * @param {string} lang - 语言代码
     * @param {function} onChunk - 每次接收到数据块的回调 (content)
     * @param {function} onComplete - 完成时的回调 (citations, related_questions)
     * @param {function} onError - 错误回调
     */
    generateStream: function(functionType, variables, lang, onChunk, onComplete, onError) {
        AIPrompt.buildMessages(functionType, variables, lang)
            .then(function(messages) {
                if (!messages || messages.length === 0) {
                    return onError(new Error('无法获取提示词模板'));
                }
                
                var requestBody = JSON.stringify({
                    model: 'magisterium-1',
                    messages: messages,
                    stream: true,  // 启用流式响应
                    return_related_questions: false,
                    temperature: 1.2,  // 更高的随机性
                    top_p: 0.95  // 添加 top_p 参数
                });
                
                var apiKey = process.env.MAGISTERIUM_API_KEY;
                if (!apiKey) {
                    Logger.error('未配置 MAGISTERIUM_API_KEY');
                    return onError(new Error('未配置 API 密钥，请联系管理员'));
                }
                
                Logger.info('调用 Magisterium API (流式)', {
                    functionType: functionType,
                    messagesCount: messages.length
                });
                
                var options = {
                    hostname: 'www.magisterium.com',
                    port: 443,
                    path: '/api/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiKey,
                        'Content-Length': Buffer.byteLength(requestBody)
                    },
                    timeout: 120000 // 2分钟超时（流式响应时间更长）
                };
                
                var requestStartTime = Date.now();
                var firstChunkTime = null;
                var chunkCount = 0;
                
                var req = https.request(options, function(res) {
                    var buffer = '';
                    var citations = [];
                    var relatedQuestions = [];
                    
                    Logger.info('API 连接已建立', {
                        statusCode: res.statusCode,
                        timeElapsed: Date.now() - requestStartTime + 'ms'
                    });
                    
                    res.on('data', function(chunk) {
                        chunkCount++;
                        if (!firstChunkTime) {
                            firstChunkTime = Date.now();
                            Logger.info('收到首个数据块', {
                                timeFromRequest: (firstChunkTime - requestStartTime) + 'ms',
                                chunkSize: chunk.length
                            });
                        }
                        buffer += chunk.toString();
                        var lines = buffer.split('\n');
                        
                        // 保留最后一个不完整的行
                        buffer = lines.pop() || '';
                        
                        for (var i = 0; i < lines.length; i++) {
                            var line = lines[i].trim();
                            
                            if (line.startsWith('data: ')) {
                                var dataStr = line.substring(6);
                                
                                if (dataStr === '[DONE]') {
                                    continue;
                                }
                                
                                try {
                                    var data = JSON.parse(dataStr);
                                    
                                    // 提取内容增量
                                    if (data.choices && 
                                        data.choices.length > 0 && 
                                        data.choices[0].delta && 
                                        data.choices[0].delta.content) {
                                        
                                        var content = data.choices[0].delta.content;
                                        
                                        // 检查是否包含替换字符（U+FFFD �）
                                        if (content.indexOf('\uFFFD') !== -1 || content.indexOf('�') !== -1) {
                                            Logger.warn('API 返回内容包含替换字符', {
                                                content: content,
                                                hex: Buffer.from(content, 'utf8').toString('hex')
                                            });
                                        }
                                        
                                        onChunk(content);
                                    }
                                    
                                    // 提取引用资料（通常在最后）
                                    if (data.citations) {
                                        citations = data.citations;
                                    }
                                    
                                    if (data.related_questions) {
                                        relatedQuestions = data.related_questions;
                                    }
                                } catch (err) {
                                    // 跳过无法解析的行
                                    Logger.warn('无法解析流式数据', { line: line });
                                }
                            }
                        }
                    });
                    
                    res.on('end', function() {
                        var totalTime = Date.now() - requestStartTime;
                        Logger.info('AI 流式生成完成', {
                            functionType: functionType,
                            citationsCount: citations.length,
                            totalTime: totalTime + 'ms',
                            firstChunkDelay: firstChunkTime ? (firstChunkTime - requestStartTime) + 'ms' : 'N/A',
                            totalChunks: chunkCount
                        });
                        
                        onComplete(citations, relatedQuestions);
                    });
                    
                    res.on('error', function(err) {
                        Logger.error('流式响应错误', { error: err.message });
                        onError(err);
                    });
                });
                
                req.on('error', function(err) {
                    Logger.error('API 请求失败', { error: err.message });
                    onError(new Error('网络错误：' + err.message));
                });
                
                req.on('timeout', function() {
                    req.destroy();
                    onError(new Error('请求超时，请稍后重试'));
                });
                
                req.write(requestBody);
                req.end();
            })
            .catch(function(err) {
                Logger.error('构建消息失败', { error: err.message });
                onError(err);
            });
    }
};

module.exports = MagisteriumService;
