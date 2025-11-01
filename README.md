# sigao-ai — 导入演示

这个目录包含一个最小的导入 dry-run 示例：

- `sql/create_tables.sql` - 创建数据库与表（包含 `verses`，`translations`，`books` 等）。
- `docker-compose.yml` - 启动 MySQL 服务并在容器初始化时加载 `sql/` 目录下的脚本。
- `scripts/import_excel.ts` - 一个 TypeScript 脚本示例：会确保 schema 存在并插入几条示例行，演示 `verse_ref`、`line_index` 的写法与查询。

运行示例（在 dev container 中）：

```bash
# 安装依赖
npm install

# 启动 MySQL
docker-compose up -d

# 等待 MySQL 启动后运行导入 dry-run
npx ts-node ./scripts/import_excel.ts
```

环境变量（可用 `.env` 覆盖）：

- DB_HOST (默认 127.0.0.1)
- DB_PORT (默认 3306)
- DB_USER (默认 sigao)
- DB_PASS (默认 sigao)
- DB_NAME (默认 sigao_ai)
# sigao-ai
思高圣经读经辅助
