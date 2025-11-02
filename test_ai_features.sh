#!/bin/bash

echo "=========================================="
echo "AI 功能集成测试"
echo "=========================================="
echo ""

# 测试 1: 检查数据库表
echo "1. 检查 ai_prompts 表..."
docker-compose exec -T mysql mysql -u sigao -psigao sigao_ai -e "SELECT COUNT(*) as total FROM ai_prompts;" 2>/dev/null | tail -1
echo ""

# 测试 2: 检查管理后台路由
echo "2. 测试管理后台提示词列表..."
curl -s http://localhost:3000/admin/prompts | grep -o '<title>.*</title>'
echo ""

# 测试 3: 测试经文页面是否有 AI 按钮
echo "3. 测试经文页面 AI 功能..."
curl -s 'http://localhost:3000/api/verses?bookId=1&chapter=1' | head -3
echo ""

# 测试 4: 检查 API 路由是否注册
echo "4. 检查 AI API 路由..."
echo "POST /api/ai/generate 应该返回 400（缺少参数）"
curl -s -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{}' | head -3
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "📝 下一步操作："
echo "1. 访问 http://localhost:3000/admin/prompts 查看提示词管理"
echo "2. 访问任意经文章节页面（如 http://localhost:3000/#/chapter/1/1）"
echo "3. 点击 AI 功能按钮测试生成"
echo ""
