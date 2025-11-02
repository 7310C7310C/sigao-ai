# AI 功能修复验证清单

## ✅ 后端功能验证（已通过测试）

### 1. 数据库缓存 ✅
- [x] 首次请求调用 AI API（5-10秒）
- [x] 数据保存到 ai_responses_cache 表
- [x] 第二次请求使用缓存（< 50ms）
- [x] 刷新页面后仍使用缓存
- [x] 中文内容正确存储（无乱码）

**测试命令：**
```bash
# 缓存测试
curl -s -X POST "http://localhost:3000/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{"function_type":"summary","book_id":1,"chapter":1}' \
  | jq '.cached'
# 应返回: true（第二次请求）

# 性能测试
time curl -s -X POST "http://localhost:3000/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{"function_type":"summary","book_id":1,"chapter":1}' > /dev/null
# 应显示: real 0m0.049s（< 100ms）
```

### 2. 中文编码 ✅
- [x] 响应中的中文正确显示
- [x] 数据库中的中文正确存储
- [x] 无 ? 或 � 乱码符号

**测试命令：**
```bash
docker-compose exec -T mysql mysql -u sigao -psigao sigao_ai \
  --default-character-set=utf8mb4 \
  -e "SELECT SUBSTRING(JSON_EXTRACT(response_json, '$.content'), 1, 60) as preview FROM ai_responses_cache LIMIT 1;" 2>/dev/null
# 应显示正常中文：这段经文是《玛窦福音》...
```

### 3. API 响应格式 ✅
- [x] success: true
- [x] cached: true/false
- [x] data.content 存在且为字符串
- [x] data.citations 数组存在

**测试命令：**
```bash
curl -s -X POST "http://localhost:3000/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{"function_type":"summary","book_id":1,"chapter":1}' \
  | jq '{success, cached, has_content: (.data.content != null), citation_count: (.data.citations | length)}'
```

---

## 🔲 前端功能验证（需在浏览器测试）

### 1. X 关闭按钮样式
访问：http://localhost:3000/#/book/1/chapter/1

- [ ] 点击任一 AI 按钮（📋 经文总结 / 📖 历史背景 / ⛪ 圣人圣事 / 🙏 祈祷默想）
- [ ] 检查右上角 X 按钮：
  - [ ] 桌面端：X 图案居中，大小适中（不会太大）
  - [ ] 移动端（F12 切换到手机模拟）：X 图案在圆圈正中心

**预期效果：**
- X 按钮使用 flexbox 居中，不再偏移
- 字体大小：桌面 1.25rem，移动端 1.5rem（比之前小）

### 2. 引用资料文案
在 AI 内容区查看引用列表：

- [ ] 引用链接文案为 "🔗 原文链接"（不是 "查看原文"）
- [ ] 引用后面没有 ↩ 返回箭头

**预期效果：**
```
[1] 教宗权威文档标题
    作者名 · 1950年 · 文档位置
    🔗 原文链接          ← 应该是这个文案，无 ↩
```

### 3. 重新生成按钮
滚动到 AI 内容区最底部：

- [ ] 看到 "🔄 重新生成新回答" 按钮
- [ ] 按钮居中显示
- [ ] 按钮上方有分隔线
- [ ] 点击按钮后：
  - [ ] 内容区显示加载状态
  - [ ] 5-10秒后显示新内容
  - [ ] 新内容与旧内容不同（或相似但重新生成）
  - [ ] 关闭后再次打开，使用新缓存（< 1秒）

**预期效果：**
```
... AI 内容 ...

[引用资料]
...

─────────────────────────
    🔄 重新生成新回答
```

### 4. 深色模式
启用深色模式（如果项目有此功能）：

- [ ] X 按钮在深色背景下可见
- [ ] 重新生成按钮在深色背景下样式正确
- [ ] 引用链接颜色适配深色模式

---

## 🔲 缓存逻辑验证（需在浏览器测试）

### 测试步骤：

1. **首次加载**
   - [ ] 访问 http://localhost:3000/#/book/1/chapter/2
   - [ ] 点击 "📋 经文总结"
   - [ ] 等待 5-10 秒加载
   - [ ] 内容显示正常，无乱码

2. **内存缓存测试**
   - [ ] 关闭 AI 内容区
   - [ ] 再次点击 "📋 经文总结"
   - [ ] 应该立即显示（< 0.5秒，使用内存缓存）

3. **数据库缓存测试**
   - [ ] **刷新页面**（Ctrl+R / Cmd+R）
   - [ ] 页面重新加载
   - [ ] 再次点击 "📋 经文总结"
   - [ ] 应该快速显示（< 1秒，使用数据库缓存）

4. **强制重新生成测试**
   - [ ] 滚动到底部点击 "🔄 重新生成新回答"
   - [ ] 等待 5-10 秒
   - [ ] 新内容显示
   - [ ] 关闭后再打开，使用新缓存（快速）

---

## 🔲 跨章节测试

- [ ] 第 1 章：玛窦福音 1:1
- [ ] 第 2 章：玛窦福音 1:2
- [ ] 第 10 章：玛窦福音 1:10
- [ ] 切换不同书卷：若望福音、路加福音

每个章节：
- [ ] 首次请求较慢（5-10秒）
- [ ] 第二次请求快速（< 1秒）
- [ ] 中文显示正常
- [ ] 引用资料格式正确

---

## 🔲 移动端测试

使用浏览器开发者工具（F12）切换到移动设备模拟：
- [ ] iPhone SE（小屏）
- [ ] iPhone 12 Pro（中屏）
- [ ] iPad Air（平板）

检查：
- [ ] X 按钮大小适中，居中对齐
- [ ] 重新生成按钮可点击，不会太小（最小 44x44px）
- [ ] 引用链接可点击
- [ ] AI 内容区可滚动
- [ ] 文字大小适中，可读性好

---

## 🔲 错误处理测试

### 1. 网络错误
```bash
# 停止 AI API
docker-compose stop web
```

- [ ] 点击 AI 按钮
- [ ] 应该显示错误提示
- [ ] 不会白屏或崩溃

### 2. 无效参数
```bash
curl -X POST "http://localhost:3000/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{"function_type":"invalid"}'
```

- [ ] 返回 400 错误
- [ ] 包含错误信息

---

## 📊 性能基准

| 指标 | 目标值 | 测试结果 |
|------|--------|----------|
| 首次 AI 请求 | 5-10秒 | ___秒 |
| 内存缓存命中 | < 0.5秒 | ___秒 |
| 数据库缓存命中 | < 1秒 | ___秒 |
| 强制重新生成 | 5-10秒 | ___秒 |

---

## 🐛 如果发现问题

### X 按钮未居中
检查 `public/css/style.css` 第 889-910 行：
```css
.ai-close-btn {
    display: flex;
    align-items: center;      /* ← 垂直居中 */
    justify-content: center;  /* ← 水平居中 */
    font-size: 1.25rem;
}
```

### 缓存不工作
```bash
# 查看日志
docker-compose logs --tail=50 web | grep -E "(cached|AIResponse|缓存)"

# 检查数据库
docker-compose exec -T mysql mysql -u sigao -psigao sigao_ai \
  -e "SELECT COUNT(*) as cache_count FROM ai_responses_cache;" 2>/dev/null
```

### 中文乱码
```bash
# 检查数据库编码
docker-compose exec -T mysql mysql -u sigao -psigao sigao_ai \
  -e "SHOW CREATE TABLE ai_responses_cache\G" 2>/dev/null

# 应该看到：
# CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### 重新生成按钮不工作
- 打开浏览器控制台（F12）
- 点击重新生成按钮
- 查看是否有 JavaScript 错误
- 检查网络请求是否包含 `force_regenerate: true`

---

## 📝 测试完成后

请填写以下信息：

**测试日期：** ___________  
**测试人：** ___________  
**浏览器：** ___________  
**移动设备：** ___________  

**问题记录：**
- [ ] 无问题
- [ ] 有问题（请描述）：

___________________________________
___________________________________
___________________________________

**总体评价：**
- [ ] 完全符合预期 ✅
- [ ] 部分功能有问题 ⚠️
- [ ] 需要重新修复 ❌
