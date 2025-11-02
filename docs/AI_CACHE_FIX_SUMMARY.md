# AI 功能完整修复总结

## 修复日期
2025-11-02

## 问题列表与修复方案

### 1. ❌ AI 内容乱码问题（�符号）

**原因：**
- 数据库连接未正确配置字符集
- 保存中文内容时使用了默认编码导致乱码

**解决方案：**
```javascript
// config/database.js
charset: 'utf8mb4',
collation: 'utf8mb4_unicode_ci',
connectionOptions: {
    charset: 'utf8mb4'
}
```

**测试步骤：**
1. 清空缓存表：`TRUNCATE TABLE ai_responses_cache;`
2. 重启服务
3. 调用 AI 生成
4. 检查数据库中的 `response_json` 字段是否正确存储中文

---

### 2. ✅ 数据库缓存未启用

**原因：**
- AIResponse 模型只有 truncate 方法，没有保存和查询功能
- AI Controller 直接调用 API，没有保存到数据库
- 前端缓存只在内存中，刷新页面丢失

**解决方案：**

**AIResponse 模型** (`src/models/AIResponse.js`):
```javascript
// 新增方法：
- findCached(bookId, chapter, functionType, lang)  // 查询缓存
- saveCache(...)  // 保存缓存
- deleteCache(...)  // 删除缓存
```

**AI Controller** (`src/controllers/ai.controller.js`):
```javascript
// 修改流程：
1. 检查数据库缓存
2. 有缓存 → 直接返回（cached: true）
3. 无缓存 → 调用 API → 保存数据库 → 返回（cached: false）
4. 支持 force_regenerate 参数强制重新生成
```

**效果：**
- 首次请求：调用 AI API（~5-10秒）
- 后续请求：从数据库读取（< 50ms）
- 刷新页面后仍然使用缓存
- 缓存有效期：30天

---

### 3. ✅ X 关闭按钮样式优化

**问题：**
- 图案太大
- 手机端不在圆心

**解决方案：**
```css
.ai-close-btn {
    /* 使用 flexbox 居中 */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;  /* 缩小 */
    line-height: 1;
}

@media (max-width: 480px) {
    .ai-close-btn {
        font-size: 1.5rem;  /* 移动端适中 */
    }
}
```

---

### 4. ✅ 引用资料文案修改

**修改内容：**
- "🔗 查看原文" → "🔗 原文链接"
- 移除每个引用后的 ↩ 返回控件

**代码位置：** `public/js/router.js` 第 729-733 行

---

### 5. ✅ 重新生成新回答按钮

**功能：**
- 位置：AI 内容区底部居中
- 样式：蓝色按钮（44px 高度），响应式设计
- 功能：删除当前缓存，强制调用 API 生成新内容

**实现：**
```javascript
// 全局函数
window.regenerateAIContent = function() {
    // 1. 清除内存缓存
    delete contentCache[cacheKey];
    // 2. 发送请求（force_regenerate: true）
    requestAI(..., true);
};

// 后端支持
POST /api/ai/generate
{
    "force_regenerate": true  // 跳过数据库缓存
}
```

---

## 数据流程图

```
前端请求 → AI Controller
              ↓
         检查数据库缓存？
         ├─ 有 → 返回缓存数据（cached: true）
         └─ 无 ↓
            调用 Magisterium API
                  ↓
            保存到数据库（30天TTL）
                  ↓
            返回新数据（cached: false）
```

---

## 文件修改清单

### 后端文件

1. **`config/database.js`**
   - 添加 `collation: 'utf8mb4_unicode_ci'`
   - 添加 `connectionOptions`

2. **`src/models/AIResponse.js`**
   - 添加 `findCached()` 方法（110 行）
   - 添加 `saveCache()` 方法
   - 添加 `deleteCache()` 方法
   - 完整 CRUD 操作

3. **`src/controllers/ai.controller.js`**
   - 导入 `AIResponse` 模型
   - 添加 `force_regenerate` 参数支持
   - 实现缓存查询逻辑
   - 实现缓存保存逻辑
   - 返回 `cached` 字段标识是否使用缓存

### 前端文件

4. **`public/js/router.js`**
   - 添加 `currentAIInfo` 对象（第 522-526 行）
   - 添加 `window.regenerateAIContent()` 全局函数
   - 修改 `requestAI()` 支持 `forceRegenerate` 参数
   - 修改引用资料文案和 HTML 结构
   - 添加重新生成按钮

5. **`public/css/style.css`**
   - 优化 `.ai-close-btn` 样式（flexbox 居中）
   - 添加 `.ai-regenerate-container` 样式
   - 添加 `.ai-regenerate-btn` 样式
   - 深色模式适配

---

## API 响应格式

```json
{
    "success": true,
    "cached": false,  // ← 新增字段
    "data": {
        "content": "AI 生成的内容...",
        "citations": [
            {
                "document_title": "标题",
                "document_author": "作者",
                "document_reference": "引用位置",
                "document_year": "年份",
                "source_url": "https://..."
            }
        ],
        "related_questions": []
    }
}
```

---

## 数据库表结构

```sql
CREATE TABLE ai_responses_cache (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id INT,
    chapter INT,
    function_type VARCHAR(64),
    lang VARCHAR(16),
    input_hash CHAR(64),           -- 经文内容哈希（用于检测经文是否变化）
    response_json JSON,             -- 完整响应数据
    tokens_used INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ttl_expires_at DATETIME,        -- 过期时间（30天后）
    INDEX idx_cache_lookup (book_id, chapter, function_type, lang)
);
```

---

## 测试验证步骤

### 1. 清空数据并重启

```bash
# 清空缓存表
docker-compose exec -T mysql mysql -u sigao -psigao sigao_ai \
  -e "TRUNCATE TABLE ai_responses_cache;" 2>/dev/null

# 重启服务
docker-compose restart web
sleep 5
```

### 2. 测试首次请求（应该调用 API）

```bash
curl -X POST "http://localhost:3000/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{"function_type":"summary","book_id":1,"chapter":1}' \
  | jq '.cached, (.data.content | length)'
```

**实际输出：** ✅
```
false       # 首次请求，无缓存
2269        # 内容长度
```

### 3. 检查数据库存储

```bash
docker-compose exec -T mysql mysql -u sigao -psigao sigao_ai \
  --default-character-set=utf8mb4 \
  -e "SELECT id, function_type, book_id, chapter, 
      SUBSTRING(JSON_EXTRACT(response_json, '$.content'), 1, 50) as preview 
      FROM ai_responses_cache;" 2>/dev/null
```

**实际输出：** ✅
```
id | function_type | book_id | chapter | preview
1  | summary       | 1       | 1       | "这段经文是《玛窦福音》第一章..."
```

✅ **中文正确显示，编码修复成功！**

### 4. 测试缓存命中（应该从数据库读取）

```bash
time curl -X POST "http://localhost:3000/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{"function_type":"summary","book_id":1,"chapter":1}' \
  | jq '.cached'
```

**实际输出：** ✅
```
true        # 使用缓存
real 0m0.049s  # 极快（49ms）
```

### 5. 完整响应验证

```bash
curl -s -X POST "http://localhost:3000/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{"function_type":"summary","book_id":1,"chapter":1}' \
  | jq '{success, cached, content_length: (.data.content | length), has_citations: (.data.citations | length > 0)}'
```

**实际输出：** ✅
```json
{
  "success": true,
  "cached": true,
  "content_length": 2269,
  "has_citations": true
}
```

### 6. 前端测试

1. 访问：http://localhost:3000/#/book/1/chapter/1
2. 点击 "📋 经文总结" → 等待加载（首次 5-10秒）
3. 检查内容是否有乱码（应该是正常中文）
4. 关闭 AI 区
5. **刷新页面** → 再次点击 "📋 经文总结" → 应该秒开（< 1秒）
6. 滚动到底部，点击 "🔄 重新生成新回答" → 等待新内容
7. 检查引用资料：
   - 文案是否为 "🔗 原文链接"
   - 是否没有 ↩ 符号
8. 检查 X 按钮：
   - 桌面端：图案是否居中，大小适中
   - 移动端：图案是否居中，是否更大

---

## 常见问题排查

### Q1: 数据库中仍然是乱码
```bash
# 检查表字符集
docker-compose exec -T mysql mysql -u sigao -psigao sigao_ai \
  -e "SHOW CREATE TABLE ai_responses_cache\G" 2>/dev/null

# 应该看到：
# CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### Q2: 缓存查询返回 null
```bash
# 查看日志
docker-compose logs --tail=50 web | grep AIResponse

# 应该看到：
# [AIResponse] responseJson 类型: object
# [AIResponse] ✅ 返回缓存数据
```

### Q3: 重新生成按钮不工作
```bash
# 检查浏览器控制台
# 应该没有 JavaScript 错误
# 检查网络请求：force_regenerate: true
```

---

## 性能指标

| 场景 | 首次请求 | 缓存命中 | 强制重新生成 |
|------|----------|----------|--------------|
| 响应时间 | 5-10秒 | < 50ms | 5-10秒 |
| API 调用 | ✅ | ❌ | ✅ |
| 数据库读 | ❌ | ✅ | ❌ |
| 数据库写 | ✅ | ❌ | ✅ |

---

## 下一步优化建议

1. **经文版本控制**
   - 使用 `input_hash` 检测经文内容是否变化
   - 经文更新后自动失效缓存

2. **缓存管理界面**
   - 管理员可查看缓存统计
   - 手动清除特定缓存

3. **性能监控**
   - 记录 API 调用次数和响应时间
   - 缓存命中率统计

4. **智能预加载**
   - 用户浏览某章时，后台预加载相邻章节的 AI 内容

---

## 更新日志

- 2025-11-02：完成数据库缓存功能
- 2025-11-02：修复字符编码问题
- 2025-11-02：优化 UI 交互（X按钮、重新生成）
- 2025-11-02：完善引用资料显示

---

**所有修复已完成并待测试验证** ✅
