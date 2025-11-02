#!/bin/bash

# AI 结果区修复验证脚本
# 使用方法：bash test_ai_fixes.sh

echo "=========================================="
echo "AI 结果区修复验证测试"
echo "=========================================="
echo ""

# 检查服务状态
echo "1. 检查服务状态..."
if docker-compose ps | grep -q "Up"; then
    echo "   ✅ 服务正常运行"
else
    echo "   ❌ 服务未运行，请先启动：docker-compose up -d"
    exit 1
fi
echo ""

# 检查关键文件是否存在
echo "2. 检查修改的文件..."
files=(
    "public/js/router.js"
    "public/js/main.js"
    "public/css/style.css"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file 不存在"
    fi
done
echo ""

# 检查关键代码是否存在
echo "3. 检查关键修复代码..."

# 检查 bindCitationLinks 函数
if grep -q "function bindCitationLinks()" public/js/router.js; then
    echo "   ✅ bindCitationLinks() 函数已添加"
else
    echo "   ❌ bindCitationLinks() 函数未找到"
fi

# 检查关闭按钮移出 header
if grep -q '<button id="ai-result-close" class="ai-close-btn">✕</button>' public/js/router.js; then
    echo "   ✅ 关闭按钮已移出 header"
else
    echo "   ❌ 关闭按钮位置未修改"
fi

# 检查返回顶部按钮修改
if grep -q "smoothScrollToTopElement" public/js/main.js; then
    echo "   ✅ smoothScrollToTopElement() 函数已添加"
else
    echo "   ❌ smoothScrollToTopElement() 函数未找到"
fi

# 检查 CSS 样式
if grep -q "z-index: 10001;" public/css/style.css; then
    echo "   ✅ 关闭按钮 z-index 已更新"
else
    echo "   ❌ 关闭按钮 z-index 未更新"
fi

echo ""

# 测试 API 端点
echo "4. 测试 API 端点..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$response" = "200" ]; then
    echo "   ✅ 主页可访问 (HTTP $response)"
else
    echo "   ❌ 主页无法访问 (HTTP $response)"
fi

response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/books)
if [ "$response" = "200" ]; then
    echo "   ✅ API 端点可访问 (HTTP $response)"
else
    echo "   ❌ API 端点无法访问 (HTTP $response)"
fi

echo ""
echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo ""
echo "请手动验证以下功能："
echo "1. 访问 http://localhost:3000/#/book/1/chapter/1"
echo "2. 点击 AI 按钮，检查右上角 X 按钮是否可见"
echo "3. 点击引用上标 [1]，是否跳转到引用列表"
echo "4. 点击 ↩ 是否返回正文"
echo "5. 关闭后重新打开是否秒加载"
echo "6. 滚动 AI 区，返回顶部按钮是否控制 AI 区滚动"
echo ""
