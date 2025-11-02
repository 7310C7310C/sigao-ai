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
                        return_related_questions: false
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
    }
};

module.exports = MagisteriumService;
