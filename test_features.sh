#!/bin/bash

echo "=========================================="
echo "功能验证测试"
echo "=========================================="
echo ""

echo "1. 测试经文页 AI 按钮（前端路由）"
echo "   访问: http://localhost:3000/#/book/1/chapter/1"
echo "   请在浏览器中打开上述链接，检查是否显示 4 个 AI 按钮"
echo ""

echo "2. 测试 AI 功能调用"
curl -s -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"function_type":"summary","book_id":1,"chapter":1,"lang":"zh"}' \
  | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ AI 生成成功' if data.get('success') else '❌ 失败: ' + data.get('message', 'Unknown'))"
echo ""

echo "3. 测试数据库字符集修复"
docker-compose exec mysql mysql -u sigao -psigao sigao_ai -e "SHOW VARIABLES LIKE 'character_set%';" 2>/dev/null | grep character_set_client | awk '{print $2 == "utf8mb4" ? "✅ 连接字符集正确: "$2 : "⚠️  连接字符集: "$2}'
echo ""

echo "4. 测试提示词内容（无乱码）"
docker-compose exec mysql mysql -u sigao -psigao sigao_ai -e "SELECT prompt_key, SUBSTRING(prompt_template, 1, 30) as preview FROM ai_prompts WHERE prompt_type='system' LIMIT 1;" 2>/dev/null | tail -1
echo ""

echo "5. 访问管理后台"
echo "   导入页: http://localhost:3000/admin"
echo "   提示词: http://localhost:3000/admin/prompts"
echo "   请在浏览器中访问查看导航按钮"
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "📝 验证清单："
echo "[ ] 经文页底部显示 4 个 AI 功能按钮"
echo "[ ] 点击按钮显示加载动画"
echo "[ ] AI 生成内容正常显示（中文无乱码）"
echo "[ ] 管理首页显示两个导航按钮"
echo "[ ] 提示词列表页内容无乱码"
echo ""
