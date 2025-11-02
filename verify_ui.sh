#!/bin/bash
# UI 优化验证脚本

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 UI 优化验证测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 检查服务状态
echo "📌 1. 检查 Web 服务状态"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "   ✅ Web 服务运行正常"
else
    echo "   ❌ Web 服务未启动"
    exit 1
fi
echo ""

# 2. 检查测试页面
echo "📌 2. 检查测试页面"
if curl -s http://localhost:3000/test_ui.html | grep -q "UI 测试页面"; then
    echo "   ✅ 测试页面可访问"
    echo "   🌐 访问: http://localhost:3000/test_ui.html"
else
    echo "   ❌ 测试页面不可用"
fi
echo ""

# 3. 检查中文编码
echo "📌 3. 检查中文编码（首页）"
CHINESE_TEST=$(curl -s http://localhost:3000 | grep -o "思高圣经" | head -1)
if [ -n "$CHINESE_TEST" ]; then
    echo "   ✅ 中文显示正常: $CHINESE_TEST"
else
    echo "   ⚠️  中文可能有问题（或页面结构已改变）"
fi
echo ""

# 4. 检查管理页
echo "📌 4. 检查管理页（提示词管理）"
ADMIN_PAGE=$(curl -s http://localhost:3000/admin/prompts | grep -o "提示词管理" | head -1)
if [ -n "$ADMIN_PAGE" ]; then
    echo "   ✅ 管理页中文正常: $ADMIN_PAGE"
    echo "   🌐 访问: http://localhost:3000/admin/prompts"
else
    echo "   ⚠️  管理页可能需要登录"
fi
echo ""

# 5. 检查 CSS 文件
echo "📌 5. 检查 CSS 更新"
if grep -q ".ai-result-content h1" public/css/style.css; then
    echo "   ✅ CSS 已包含 Markdown 样式"
else
    echo "   ❌ CSS 缺少 Markdown 样式"
fi

if grep -q "max-height: 60vh" public/css/style.css; then
    echo "   ✅ CSS 已包含滚动限制"
else
    echo "   ❌ CSS 缺少滚动限制"
fi
echo ""

# 6. 检查 JavaScript 更新
echo "📌 6. 检查 JavaScript 更新"
if grep -q "formatAIResponse" public/js/router.js; then
    echo "   ✅ JavaScript 已包含 Markdown 解析器"
else
    echo "   ❌ JavaScript 缺少 Markdown 解析器"
fi

if grep -q "activeButton" public/js/router.js; then
    echo "   ✅ JavaScript 已包含激活状态管理"
else
    echo "   ❌ JavaScript 缺少激活状态管理"
fi
echo ""

# 7. 检查视图更新
echo "📌 7. 检查管理页按钮顺序"
INDEX_ORDER=$(grep -A 5 "admin-nav-grid" views/admin/index.ejs | grep -o "提示词管理\|圣经导入" | head -2)
if echo "$INDEX_ORDER" | grep -q "提示词管理"; then
    echo "   ✅ index.ejs: 提示词管理在前"
else
    echo "   ❌ index.ejs: 按钮顺序未更新"
fi

PROMPTS_ORDER=$(grep -A 5 "admin-nav-grid" views/admin/prompts.ejs | grep -o "提示词管理\|圣经导入" | head -2)
if echo "$PROMPTS_ORDER" | grep -q "提示词管理"; then
    echo "   ✅ prompts.ejs: 提示词管理在前"
else
    echo "   ❌ prompts.ejs: 按钮顺序未更新"
fi
echo ""

# 8. 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 验证总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ 后端修改:"
echo "   - src/app.js (UTF-8 中间件)"
echo "   - src/controllers/ai.controller.js (JSON 字符集)"
echo ""
echo "✅ 前端修改:"
echo "   - public/js/router.js (Markdown 解析 + 激活状态)"
echo "   - public/css/style.css (单行按钮 + 滚动 + Markdown 样式)"
echo ""
echo "✅ 视图修改:"
echo "   - views/admin/index.ejs (按钮顺序)"
echo "   - views/admin/prompts.ejs (按钮顺序)"
echo ""
echo "🌐 测试页面:"
echo "   - http://localhost:3000/test_ui.html (UI 组件测试)"
echo "   - http://localhost:3000/#/book/1/chapter/1 (实际功能)"
echo "   - http://localhost:3000/admin (管理首页)"
echo "   - http://localhost:3000/admin/prompts (提示词管理)"
echo ""
echo "📖 文档:"
echo "   - docs/UI_OPTIMIZATION.md (本次优化详细说明)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
