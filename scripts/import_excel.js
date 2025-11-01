const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

dotenv.config();

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'sigao';
const DB_PASS = process.env.DB_PASS || 'sigao';
const DB_NAME = process.env.DB_NAME || 'sigao_ai';

async function run() {
  console.log('Import dry-run starting...');

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true
  });

  // Ensure database exists and run schema if not already initialized
  // If docker-entrypoint already initialized the DB, skip running the SQL to avoid duplicate-key errors
  const [rowsCheck] = await conn.execute("SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema=? AND table_name='translations'", [DB_NAME]);
  const exists = rowsCheck && rowsCheck[0] && rowsCheck[0].cnt > 0;
  if (!exists) {
    const sqlPath = path.join(__dirname, '..', 'sql', 'create_tables.sql');
    const sqlExists = fs.existsSync(sqlPath);
    if (sqlExists) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log('Executing create_tables.sql...');
      await conn.query(sql);
    } else {
      console.warn('create_tables.sql not found at', sqlPath);
    }
  } else {
    console.log('Database appears initialized; skipping create_tables.sql');
  }

  // connect to database
  await conn.changeUser({ database: DB_NAME });

  // ensure a translation and book exist
  const [transRows] = await conn.execute('SELECT id FROM translations WHERE code=? LIMIT 1', ['sigao_cn']);
  let translationId;
  if (transRows.length > 0) {
    translationId = transRows[0].id;
  } else {
    const [res] = await conn.execute('INSERT INTO translations (code,name,lang) VALUES (?,?,?)', ['sigao_cn', '思高(简体)', 'zh']);
    translationId = res.insertId;
  }

  const [bookRows] = await conn.execute('SELECT id FROM books WHERE code=? LIMIT 1', ['matthew']);
  let bookId;
  if (bookRows.length > 0) {
    bookId = bookRows[0].id;
  } else {
    // we set book_type based on your sample ('福音') to preserve 经卷类别
    const [res] = await conn.execute('INSERT INTO books (code,name_cn,book_type,testament,order_index) VALUES (?,?,?,?,?)', ['matthew', '玛窦福音', '福音', '新约', 1]);
    bookId = res.insertId;
  }

  // sample rows (from your provided sample)
  const sampleRows = [
    { original_row: 1, chapter: 1, verse_ref: '1', text: '亚巴郎之子，达味之子耶稣基督的族谱：' },
    { original_row: 2, chapter: 1, verse_ref: '2', text: '亚巴郎生依撒格，依撒格生雅各伯，雅各伯生犹大和他的兄弟们；' },
    { original_row: 3, chapter: 1, verse_ref: '3', text: '犹大由塔玛尔生培勒兹和则辣黑，培勒兹生赫兹龙，赫兹龙生阿兰，' }
  ];

  // compute line_index per (translation,book,chapter) grouping
  let lineIndexCounter = {};

  async function insertRow(r) {
    const chapterKey = `${translationId}_${bookId}_${r.chapter ?? -1}`;
    if (!lineIndexCounter[chapterKey]) lineIndexCounter[chapterKey] = 0;
    lineIndexCounter[chapterKey] += 1;
    const line_index = lineIndexCounter[chapterKey];
    const content_hash = crypto.createHash('sha256').update(r.text || '').digest('hex');

    const [res] = await conn.execute(
      'INSERT INTO verses (translation_id,book_id,chapter,verse_ref,line_index,type,text,content_hash,original_row) VALUES (?,?,?,?,?,?,?,?,?)',
      [translationId, bookId, r.chapter, r.verse_ref, line_index, r.verse_ref ? 'verse' : 'note', r.text, content_hash, r.original_row]
    );
    return res.insertId;
  }

  console.log('Inserting sample rows...');
  for (const r of sampleRows) {
    await insertRow(r);
  }

  console.log('Querying inserted rows...');
  const [rows] = await conn.execute('SELECT v.id, t.code as translation, b.code as book, v.chapter, v.verse_ref, v.line_index, v.type, v.text FROM verses v JOIN translations t ON v.translation_id=t.id JOIN books b ON v.book_id=b.id WHERE v.translation_id=? AND v.book_id=? ORDER BY v.chapter, v.line_index', [translationId, bookId]);
  console.table(rows);

  await conn.end();
  console.log('Dry-run import complete.');
}

run().catch(err => {
  console.error('Error in import dry-run:', err);
  process.exit(1);
});
