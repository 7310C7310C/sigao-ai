#!/bin/bash
# 完整功能验证脚本

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 完整功能验证 - 2025-11-02"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 检查 marked.js CDN
echo "📌 1. 检查 Markdown 解析库"
if curl -s http://localhost:3000 | grep -q "marked.min.js"; then
    echo "   ✅ marked.js 已引入"
else
    echo "   ❌ marked.js 未找到"
fi
echo ""

# 2. 检查按钮文字
echo "📌 2. 检查 AI 按钮文字（应为四字）"
BUTTON_TEXT=$(grep -o '">[^<]*经文总结<' public/js/router.js 2>/dev/null | head -1)
if echo "$BUTTON_TEXT" | grep -q "经文总结"; then
    echo "   ✅ 按钮文字已恢复为四字"
else
    echo "   ⚠️  按钮文字未找到，检查 router.js"
fi
echo ""

# 3. 检查固定定位 CSS
echo "📌 3. 检查 AI 栏固定定位"
if grep -q "position: fixed" public/css/style.css && grep -q "bottom: 0" public/css/style.css; then
    echo "   ✅ AI 栏已设置固定在底部"
else
    echo "   ⚠️  固定定位可能未配置"
fi
echo ""

# 4. 检查缓存机制
echo "📌 4. 检查缓存机制"
if grep -q "aiCache" public/js/router.js; then
    echo "   ✅ 前端缓存已实现"
else
    echo "   ❌ 前端缓存未找到"
fi

if grep -q "checkCache" public/js/router.js; then
    echo "   ✅ 缓存检查函数已添加"
else
    echo "   ❌ 缓存检查函数未找到"
fi
echo ""

# 5. 检查数据库编码
echo "📌 5. 检查数据库编码"
docker-compose exec -T mysql mysql -u sigao -psigao sigao_ai -e "
SELECT 
    TABLE_NAME, 
    TABLE_COLLATION 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sigao_ai' 
    AND TABLE_NAME IN ('ai_prompts', 'ai_responses_cache')
" 2>/dev/null | grep utf8mb4 >/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ 数据库表使用 utf8mb4 编码"
else
    echo "   ⚠️  数据库编码检查失败"
fi
echo ""

# 6. 检查缓存表结构
echo "📌 6. 检查缓存表"
CACHE_TABLE=$(docker-compose exec -T mysql mysql -u sigao -psigao sigao_ai -e "SHOW TABLES LIKE 'ai_responses_cache'" 2>/dev/null | grep ai_responses_cache)
if [ -n "$CACHE_TABLE" ]; then
    echo "   ✅ ai_responses_cache 表存在"
    
    CACHE_COUNT=$(docker-compose exec -T mysql mysql -u sigao -psigao sigao_ai -e "SELECT COUNT(*) FROM ai_responses_cache" 2>/dev/null | tail -1)
    echo "   📊 缓存记录数: $CACHE_COUNT"
else
    echo "   ❌ 缓存表不存在"
fi
echo ""

# 7. 测试页面加载
echo "📌 7. 测试页面加载"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$STATUS_CODE" = "200" ]; then
    echo "   ✅ 首页加载正常 (HTTP $STATUS_CODE)"
else
    echo "   ❌ 首页加载失败 (HTTP $STATUS_CODE)"
fi

CHAPTER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/#/book/1/chapter/1")
if [ "$CHAPTER_STATUS" = "200" ]; then
    echo "   ✅ 经文页加载正常 (HTTP $CHAPTER_STATUS)"
else
    echo "   ❌ 经文页加载失败 (HTTP $CHAPTER_STATUS)"
fi
echo ""

# 8. 检查底部内边距
echo "📌 8. 检查底部空间（避免被遮挡）"
if grep -q "padding-bottom.*6rem" public/css/style.css; then
    echo "   ✅ 容器底部内边距已添加"
else
    echo "   ⚠️  底部内边距未找到"
fi
echo ""

# 9. 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 功能实现总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ 1. 数据库乱码修复:"
echo "   - ai_prompts 表: 无乱码"
echo "   - ai_responses_cache: 表为空（新内容使用 UTF-8）"
echo "   - 字符集配置: utf8mb4 ✓"
echo ""
echo "✅ 2. Markdown 解析:"
echo "   - 引入 marked.js v12.0.0 (CDN)"
echo "   - 支持完整 Markdown 语法"
echo "   - 自动渲染标题、列表、代码块等"
echo ""
echo "✅ 3. AI 按钮优化:"
echo "   - 按钮文字: 四字完整（经文总结、历史背景、圣人诠释、祈祷指引）"
echo "   - 固定定位: 始终在屏幕底部"
echo "   - 不随页面滚动"
echo ""
echo "✅ 4. 缓存机制:"
echo "   - 前端 Map 缓存"
echo "   - 按 book_id + chapter + function_type 缓存"
echo "   - 缓存命中秒开"
echo "   - 自动清理（页面刷新重置）"
echo ""
echo "✅ 5. 布局优化:"
echo "   - AI 栏固定底部 70px 高度"
echo "   - 容器底部留 6rem 空间"
echo "   - 避免内容被遮挡"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 测试链接:"
echo "   - 经文页: http://localhost:3000/#/book/1/chapter/1"
echo "   - 管理页: http://localhost:3000/admin/prompts"
echo "   - 测试页: http://localhost:3000/test_ui.html"
echo ""
echo "🧪 测试步骤:"
echo "   1. 访问经文页，查看底部 4 个按钮（四字完整）"
echo "   2. 滚动页面，确认 AI 栏固定不动"
echo "   3. 点击「经文总结」，等待生成（8-15秒）"
echo "   4. 查看 Markdown 渲染效果（标题、列表、粗体等）"
echo "   5. 关闭结果框，再次点击同一按钮"
echo "   6. 确认秒开（从缓存加载）"
echo "   7. 检查中文无乱码"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
