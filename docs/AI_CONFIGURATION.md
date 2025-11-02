# AI 功能配置说明

## API 密钥配置

Magisterium API 需要认证才能使用。请按以下步骤配置：

### 1. 获取 API 密钥

访问 [Magisterium 开发者平台](https://www.magisterium.com/developers) 注册并获取 API 密钥。

### 2. 配置环境变量

在 `.env` 文件中添加：

```bash
MAGISTERIUM_API_KEY=your_api_key_here
```

### 3. 更新服务代码

修改 `/workspaces/sigao-ai/src/services/ai/magisterium.service.js`：

```javascript
// 3. 配置 HTTPS 请求
var apiKey = process.env.MAGISTERIUM_API_KEY;
if (!apiKey) {
    return reject(new Error('未配置 MAGISTERIUM_API_KEY 环境变量'));
}

var options = {
    hostname: 'www.magisterium.com',
    port: 443,
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,  // 添加此行
        'Content-Length': Buffer.byteLength(requestBody)
    },
    timeout: 30000
};
```

### 4. 重启服务

```bash
docker-compose restart web
```

## 测试验证

### 方式一：通过网页测试

1. 访问 `http://localhost:3000/#/chapter/1/1`
2. 点击任意 AI 功能按钮
3. 查看生成结果

### 方式二：通过 API 测试

```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "function_type": "summary",
    "book_id": 1,
    "chapter": 1,
    "lang": "zh"
  }'
```

## 错误处理

### 401 Unauthorized
- **原因**：API 密钥未配置或无效
- **解决**：检查 `.env` 文件中的 `MAGISTERIUM_API_KEY`

### 429 Too Many Requests
- **原因**：超出 API 调用限额
- **解决**：等待限流恢复或升级 API 套餐

### 500 Internal Server Error
- **原因**：API 服务端错误
- **解决**：稍后重试或联系 Magisterium 支持

### 请求超时
- **原因**：网络问题或 API 响应慢
- **解决**：检查网络连接，可调整 `timeout` 参数

## 离线演示模式（可选）

如果暂时没有 API 密钥，可以实现 Mock 服务用于演示：

### 创建 Mock Service

文件：`src/services/ai/magisterium.mock.js`

```javascript
var MockService = {
    generate: function(functionType, variables, lang) {
        return new Promise(function(resolve) {
            setTimeout(function() {
                var responses = {
                    summary: '这是一段模拟的经文总结内容...',
                    history: '这是一段模拟的历史背景内容...',
                    saints: '这是一段模拟的圣人诠释内容...',
                    prayer: '这是一段模拟的祈祷指引内容...'
                };
                
                resolve({
                    content: responses[functionType] || '模拟响应',
                    citations: [],
                    related_questions: []
                });
            }, 1000); // 模拟 1 秒延迟
        });
    }
};

module.exports = MockService;
```

### 切换到 Mock 模式

在 `src/controllers/ai.controller.js` 中：

```javascript
// 开发环境使用 Mock，生产环境使用真实 API
var MagisteriumService = process.env.NODE_ENV === 'production'
    ? require('../services/ai/magisterium.service')
    : require('../services/ai/magisterium.mock');
```

## 功能验证清单

- [ ] API 密钥已配置
- [ ] 服务器已重启
- [ ] 管理后台可访问提示词列表
- [ ] 经文页面显示 AI 功能按钮
- [ ] 点击按钮显示加载动画
- [ ] AI 生成内容正常显示
- [ ] 错误提示友好清晰
- [ ] 深色模式下样式正常
- [ ] 移动端布局响应式

## 常见问题

### Q: 如何修改提示词？
A: 访问 `/admin/prompts`，点击编辑按钮修改内容。

### Q: 如何添加新的功能类型？
A: 
1. 在数据库插入新的功能提示词记录
2. 在 `chapter.ejs` 添加对应按钮
3. 更新 `ai.controller.js` 的 `validFunctions` 数组

### Q: AI 生成速度慢怎么办？
A: 
1. 检查网络连接
2. 考虑使用缓存机制
3. 调整超时时间

### Q: 如何实现多语言支持？
A: 
1. 在数据库添加 `lang='en'` 的提示词
2. 前端添加语言切换逻辑
3. API 请求时传递 `lang` 参数

## 下一步开发

1. **缓存优化**：使用 `ai_responses_cache` 表存储历史响应
2. **流式输出**：实现 Server-Sent Events 或 WebSocket
3. **批量处理**：支持多章节批量生成
4. **导出功能**：生成 PDF 或分享链接
5. **统计分析**：记录 AI 调用量和用户反馈
