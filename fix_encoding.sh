#!/bin/bash
# 修复数据库乱码数据

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 数据库乱码修复工具"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 3

# 1. 检查当前字符集
echo "📌 1. 检查数据库字符集"
docker-compose exec -T db mysql -usigao -psigao -e "
SHOW VARIABLES LIKE 'character_set%';
" 2>/dev/null
echo ""

# 2. 检查表结构
echo "📌 2. 检查表字符集"
docker-compose exec -T db mysql -usigao -psigao sigao_ai -e "
SELECT TABLE_NAME, TABLE_COLLATION 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sigao_ai' 
AND TABLE_NAME IN ('ai_prompts', 'ai_responses_cache', 'verses');
" 2>/dev/null
echo ""

# 3. 备份当前数据
echo "📌 3. 备份当前数据"
docker-compose exec -T db mysqldump -usigao -psigao sigao_ai ai_prompts > /tmp/ai_prompts_backup.sql 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ ai_prompts 表已备份到 /tmp/ai_prompts_backup.sql"
else
    echo "   ❌ 备份失败"
fi
echo ""

# 4. 清空乱码数据（可选）
read -p "⚠️  是否清空 ai_prompts 和 ai_responses_cache 表的数据？(y/N): " CLEAR_DATA
if [ "$CLEAR_DATA" = "y" ] || [ "$CLEAR_DATA" = "Y" ]; then
    echo "   🗑️  清空旧数据..."
    docker-compose exec -T db mysql -usigao -psigao sigao_ai <<EOF 2>/dev/null
TRUNCATE TABLE ai_responses_cache;
DELETE FROM ai_prompts;
EOF
    echo "   ✅ 数据已清空"
else
    echo "   ⏭️  跳过清空数据"
fi
echo ""

# 5. 重新导入初始数据（如果清空了）
if [ "$CLEAR_DATA" = "y" ] || [ "$CLEAR_DATA" = "Y" ]; then
    echo "📌 5. 重新导入提示词数据"
    if [ -f "sql/migrations/002_ai_prompts.sql" ]; then
        docker-compose exec -T db mysql -usigao -psigao sigao_ai < sql/migrations/002_ai_prompts.sql 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "   ✅ 提示词数据已重新导入"
        else
            echo "   ❌ 导入失败"
        fi
    else
        echo "   ⚠️  未找到 sql/migrations/002_ai_prompts.sql"
    fi
    echo ""
fi

# 6. 验证数据
echo "📌 6. 验证中文显示"
docker-compose exec -T db mysql -usigao -psigao --default-character-set=utf8mb4 sigao_ai -e "
SELECT prompt_key, LEFT(prompt_name, 30) as name, LEFT(prompt_template, 50) as template 
FROM ai_prompts 
LIMIT 3;
" 2>/dev/null
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 修复完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 说明:"
echo "1. 旧的乱码数据已备份到 /tmp/ai_prompts_backup.sql"
echo "2. 如果选择清空，提示词数据已重新导入（UTF-8）"
echo "3. 新生成的 AI 内容将自动使用 UTF-8 编码"
echo "4. 建议清空浏览器缓存后重新测试"
echo ""
echo "🌐 测试链接:"
echo "   - http://localhost:3000/admin/prompts (提示词管理)"
echo "   - http://localhost:3000/#/book/1/chapter/1 (经文页 AI 功能)"
echo ""
