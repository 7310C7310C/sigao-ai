# 数据库设计文档

## 数据库结构

### 表：translations（译本）
存储圣经译本信息

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| code | VARCHAR(50) | 译本代码 | UNIQUE, NOT NULL |
| name | VARCHAR(255) | 译本名称 | NOT NULL |
| lang | VARCHAR(10) | 语言代码 | NOT NULL |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |

### 表：books（经卷）
存储圣经经卷信息

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| code | VARCHAR(50) | 经卷代码 | UNIQUE, NOT NULL |
| name_cn | VARCHAR(255) | 中文名称 | NOT NULL |
| book_type | VARCHAR(50) | 经卷类别 | |
| testament | VARCHAR(20) | 约别（旧约/新约） | NOT NULL |
| order_index | INT | 排序索引 | NOT NULL |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |

### 表：verses（经文）
存储圣经经文内容

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| translation_id | INT | 译本 ID | FOREIGN KEY → translations(id) |
| book_id | INT | 经卷 ID | FOREIGN KEY → books(id) |
| chapter | INT | 章节号 | NOT NULL |
| verse_ref | VARCHAR(20) | 节数引用 | |
| line_index | INT | 行索引 | NOT NULL |
| type | ENUM | 类型（verse/note） | NOT NULL |
| text | TEXT | 经文内容 | NOT NULL |
| content_hash | VARCHAR(64) | 内容哈希 | |
| original_row | INT | 原始行号 | |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |

**索引**:
- `idx_book_chapter` ON (book_id, chapter)
- `idx_translation_book` ON (translation_id, book_id)

### 表：ai_responses_cache（AI 响应缓存）
存储 AI 生成的响应缓存（预留）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| query_hash | VARCHAR(64) | 查询哈希 | UNIQUE, NOT NULL |
| response | TEXT | AI 响应内容 | |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| expires_at | TIMESTAMP | 过期时间 | |

## 数据关系

```
translations (1) ────< (N) verses
books (1) ────< (N) verses
```

## 迁移文件位置
- 初始迁移: `sql/migrations/001_initial.sql`
