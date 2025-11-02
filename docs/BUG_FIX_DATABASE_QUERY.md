# 关键 Bug 修复记录

## Bug #1: mysql2/promise query() 返回值解构错误

### 问题描述
```javascript
// 错误代码
async function query(sql, params = []) {
  const pool = getPool();
  return await pool.query(sql, params);  // ❌ 返回 [rows, fields]
}

// 调用代码
var rows = await query(sql, params);
console.log(rows[0].response_json);  // undefined
console.log(Object.keys(rows[0]));   // ['0'] 而不是 ['response_json']
```

### 根本原因
`mysql2/promise` 的 `pool.query()` 方法返回一个元组 `[rows, fields]`，而不是直接返回 rows 数组。

如果不解构，返回值结构如下：
```javascript
[
  [                          // ← rows (第一个元素)
    { response_json: {...} }
  ],
  [                          // ← fields (第二个元素)
    { name: 'response_json', ... }
  ]
]
```

当我们直接使用 `rows[0]` 时，实际上访问的是整个元组的第一个元素（即 rows 数组），而 `rows[0][0]` 才是第一行数据。

### 解决方案
```javascript
// ✅ 正确代码
async function query(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.query(sql, params);  // 解构取出 rows
  return rows;
}

// 现在调用代码可以正常工作
var rows = await query(sql, params);
console.log(rows[0].response_json);  // ✅ 正常访问
```

### 影响范围
- **AIResponse.findCached()** - 无法从数据库读取缓存
- **所有使用 query() 的地方** - 任何需要访问行字段的代码

### 测试验证
```bash
# 修复前
curl POST /api/ai/generate
→ cached: false（每次都调用 API，5-10秒）
→ 日志: rows[0] 的键: ['0']  ❌

# 修复后
curl POST /api/ai/generate（第二次）
→ cached: true（使用缓存，< 50ms）✅
→ 日志: rows[0] 的键: ['response_json']  ✅
```

---

## Bug #2: 数据库字符编码配置不完整

### 问题描述
中文内容保存到数据库后变成乱码：
```sql
SELECT JSON_EXTRACT(response_json, '$.content') FROM ai_responses_cache;
→ "????????????????????????????��������"
```

### 根本原因
虽然 `config/database.js` 配置了 `charset: 'utf8mb4'`，但缺少 `collation` 配置，导致连接使用默认的 `utf8mb4_general_ci` 或更早的字符集。

### 解决方案
```javascript
// config/database.js
module.exports = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'sigao',
  password: process.env.DB_PASSWORD || 'sigao',
  database: process.env.DB_NAME || 'sigao_ai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',                     // ✅ 字符集
  collation: 'utf8mb4_unicode_ci',        // ✅ 排序规则（新增）
  connectionOptions: {                     // ✅ 连接选项（新增）
    charset: 'utf8mb4'
  }
};
```

### 测试验证
```bash
# 清空旧数据
TRUNCATE TABLE ai_responses_cache;

# 重启服务
docker-compose restart web

# 重新生成数据
curl POST /api/ai/generate

# 验证中文
docker-compose exec mysql \
  mysql --default-character-set=utf8mb4 \
  -e "SELECT SUBSTRING(JSON_EXTRACT(response_json, '$.content'), 1, 50) FROM ai_responses_cache;"

→ "这段经文是《玛窦福音》第一章的全部内容，包含了耶稣基督的**族谱**..."  ✅
```

---

## 性能对比

| 场景 | 修复前 | 修复后 | 提升 |
|------|--------|--------|------|
| 首次请求 | 5-10秒 | 5-10秒 | - |
| 第二次请求 | 5-10秒 ❌ | **49ms** ✅ | **100x+** |
| 刷新页面后 | 5-10秒 ❌ | **49ms** ✅ | **100x+** |
| 中文显示 | ???????????? ❌ | 这段经文... ✅ | 可用 |

---

## 相关文件

### 修改的文件
1. **src/models/database.js**
   - 修复 query() 返回值解构

2. **config/database.js**
   - 添加 collation 配置
   - 添加 connectionOptions

3. **src/models/AIResponse.js**
   - 实现 findCached() 方法
   - 实现 saveCache() 方法
   - 实现 deleteCache() 方法

4. **src/controllers/ai.controller.js**
   - 添加缓存查询逻辑
   - 添加缓存保存逻辑
   - 支持 force_regenerate 参数

### 未修改但相关的文件
- **public/js/router.js** - 前端 AI 交互逻辑（已完成 UI 修改）
- **public/css/style.css** - 样式优化（已完成）

---

## 调试技巧

### 1. 查看 query() 返回值结构
```javascript
var result = await pool.query(sql, params);
console.log('结果类型:', Array.isArray(result));
console.log('结果长度:', result.length);
console.log('第一个元素类型:', Array.isArray(result[0]));
console.log('第二个元素类型:', Array.isArray(result[1]));
console.log('rows[0] 的键:', result[0].length > 0 ? Object.keys(result[0][0]) : 'empty');
```

### 2. 检查数据库字符编码
```bash
# 检查表字符集
SHOW CREATE TABLE ai_responses_cache\G

# 检查连接字符集
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

# 使用正确字符集查询
mysql --default-character-set=utf8mb4 ...
```

### 3. 检查 JSON 字段内容
```sql
-- 查看前 100 个字符
SELECT LEFT(JSON_EXTRACT(response_json, '$.content'), 100) FROM ai_responses_cache;

-- 检查是否包含乱码
SELECT 
  id,
  JSON_EXTRACT(response_json, '$.content') LIKE '%?%' as has_question_marks,
  JSON_EXTRACT(response_json, '$.content') LIKE '%�%' as has_replacement_char
FROM ai_responses_cache;
```

---

## 经验教训

1. **始终解构 mysql2/promise 的返回值**
   ```javascript
   // 推荐使用 execute 替代 query（更安全）
   const [rows] = await pool.execute(sql, params);
   
   // 或者明确解构 query 的返回值
   const [rows, fields] = await pool.query(sql, params);
   ```

2. **字符编码必须在连接层配置完整**
   - `charset` 指定字符集
   - `collation` 指定排序规则
   - `connectionOptions.charset` 确保连接初始化时使用正确字符集

3. **使用调试日志追踪数据结构**
   ```javascript
   console.log('数据类型:', typeof data);
   console.log('数据键:', Object.keys(data));
   console.log('第一个元素:', data[0]);
   ```

4. **测试数据库操作时使用正确的字符集客户端**
   ```bash
   # 错误：使用默认字符集
   mysql -e "SELECT ..."
   
   # 正确：指定 utf8mb4
   mysql --default-character-set=utf8mb4 -e "SELECT ..."
   ```

---

**修复完成日期：** 2025-11-02  
**测试状态：** ✅ 全部通过  
**性能提升：** 100x+（5-10秒 → 49ms）
