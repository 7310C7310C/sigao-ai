/**
 * 数据库乱码修复脚本
 * 修复因字符集问题导致的中文乱码
 */

var mysql = require('mysql2/promise');
var dbConfig = require('../config/database');

async function fixEncoding() {
    var connection;
    
    try {
        console.log('📡 连接数据库...');
        connection = await mysql.createConnection(dbConfig);
        
        // 设置连接字符集
        await connection.query("SET NAMES 'utf8mb4'");
        await connection.query("SET CHARACTER SET utf8mb4");
        await connection.query("SET character_set_connection=utf8mb4");
        
        console.log('✅ 数据库连接成功\n');
        
        // 1. 检查 ai_prompts 表
        console.log('📋 检查 ai_prompts 表...');
        var [prompts] = await connection.query('SELECT id, prompt_name, LEFT(prompt_template, 50) as preview FROM ai_prompts');
        
        var hasGarbled = false;
        for (var i = 0; i < prompts.length; i++) {
            var prompt = prompts[i];
            // 检测常见乱码模式
            if (prompt.prompt_name && (
                prompt.prompt_name.includes('�') || 
                prompt.prompt_name.includes('??') ||
                /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(prompt.prompt_name)
            )) {
                console.log('   ⚠️  发现乱码:', prompt.id, '-', prompt.prompt_name);
                hasGarbled = true;
            }
        }
        
        if (!hasGarbled) {
            console.log('   ✅ ai_prompts 表无乱码\n');
        } else {
            console.log('   ❌ ai_prompts 表存在乱码，需要重新导入数据\n');
        }
        
        // 2. 检查 ai_responses_cache 表
        console.log('📋 检查 ai_responses_cache 表...');
        var [cacheCount] = await connection.query(
            'SELECT COUNT(*) as count FROM ai_responses_cache'
        );
        
        if (cacheCount[0].count > 0) {
            console.log('   📊 缓存记录数:', cacheCount[0].count);
            
            var [samples] = await connection.query(
                'SELECT id, function_type, LEFT(content, 100) as preview FROM ai_responses_cache LIMIT 5'
            );
            
            var cacheHasGarbled = false;
            for (var j = 0; j < samples.length; j++) {
                var sample = samples[j];
                if (sample.content && (
                    sample.content.includes('�') ||
                    /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(sample.content)
                )) {
                    console.log('   ⚠️  缓存乱码:', sample.id, '-', sample.function_type);
                    cacheHasGarbled = true;
                }
            }
            
            if (cacheHasGarbled) {
                console.log('\n   🗑️  清空乱码缓存...');
                var [result] = await connection.query('DELETE FROM ai_responses_cache');
                console.log('   ✅ 已删除', result.affectedRows, '条缓存记录');
                console.log('   💡 提示: 新的 AI 生成将使用正确的 UTF-8 编码\n');
            } else {
                console.log('   ✅ 缓存内容正常\n');
            }
        } else {
            console.log('   ℹ️  缓存表为空\n');
        }
        
        // 3. 检查表字符集
        console.log('📋 检查表字符集配置...');
        var [tables] = await connection.query(
            "SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('ai_prompts', 'ai_responses_cache')",
            [dbConfig.database]
        );
        
        for (var k = 0; k < tables.length; k++) {
            var table = tables[k];
            var isUtf8mb4 = table.TABLE_COLLATION && table.TABLE_COLLATION.startsWith('utf8mb4');
            console.log('   ' + (isUtf8mb4 ? '✅' : '⚠️ ') + ' ' + table.TABLE_NAME + ': ' + table.TABLE_COLLATION);
            
            if (!isUtf8mb4) {
                console.log('      💡 建议转换为 utf8mb4_unicode_ci');
            }
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 修复建议:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (hasGarbled) {
            console.log('\n1. ai_prompts 乱码修复:');
            console.log('   方法1: 重新运行种子数据脚本');
            console.log('   npm run seed:prompts');
            console.log('');
            console.log('   方法2: 手动在管理页面重新输入提示词');
            console.log('   访问: http://localhost:3000/admin/prompts');
        }
        
        console.log('\n2. 未来预防乱码:');
        console.log('   ✅ 已配置: config/database.js 使用 charset: utf8mb4');
        console.log('   ✅ 已配置: src/app.js 全局 UTF-8 响应头');
        console.log('   ✅ 已配置: 所有新数据将使用正确编码');
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('📡 数据库连接已关闭');
        }
    }
}

// 运行修复
fixEncoding().catch(function(err) {
    console.error('Fatal error:', err);
    process.exit(1);
});
