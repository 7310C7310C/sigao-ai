const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const basicAuth = require('express-basic-auth');
const path = require('path');
const os = require('os');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));

const upload = multer({ dest: os.tmpdir() });

async function getConn(){
  return mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'sigao',
    password: process.env.DB_PASS || 'sigao',
    database: process.env.DB_NAME || 'sigao_ai',
    waitForConnections: true,
    connectionLimit: 10
  });
}

// Simple admin auth (change in production)
app.use('/admin', basicAuth({ users: { 'admin': process.env.ADMIN_PASS || 'admin' }, challenge: true }));

// Admin page: upload xlsx
app.get('/admin', (req, res) => {
  res.render('admin', { message: null });
});

app.post('/admin/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const workbook = xlsx.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const pool = await getConn();
  const conn = await pool.getConnection();
  try{
    await conn.beginTransaction();
    // Clear existing content (admin requested full import)
  await conn.query('SET FOREIGN_KEY_CHECKS=0');
  await conn.query('TRUNCATE TABLE ai_responses_cache');
  await conn.query('TRUNCATE TABLE verses');
  await conn.query('TRUNCATE TABLE books');
  await conn.query('TRUNCATE TABLE translations');
  await conn.query('SET FOREIGN_KEY_CHECKS=1');

    // create translation
    const [trows] = await conn.execute('INSERT INTO translations (code,name,lang) VALUES (?,?,?)', ['sigao_cn', '思高(简体)', 'zh']);
    const translationId = trows.insertId;

    // process rows: expected headers: 约别, 经卷类别, 卷名, 章, 节, 经文内容
    // We'll map book names to codes (slug) by lowercasing ascii letters, else use pinyin fallback
    const bookMap = new Map();
    let lastLineIndex = {};
    for (let i=0;i<rows.length;i++){
      const r = rows[i];
      // normalize keys (in case of header names differences)
      const testament = r['约别'] || r['约别'] || '';
      const bookType = r['经卷类别'] || r['经卷类别'] || '';
      const bookName = r['卷名'] || r['卷名'] || r['书卷'] || '';
      const chapterRaw = String(r['章'] || '').trim();
      const verseRaw = String(r['节'] || '').trim();
      const text = String(r['经文内容'] || r['经文内容'] || '').trim();

      // map book
      let bookCode = bookMap.get(bookName);
      if (!bookCode) {
        // slugify simple
        bookCode = bookName.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'') || `book_${bookMap.size+1}`;
        const [bres] = await conn.execute('INSERT INTO books (code,name_cn,book_type,testament,order_index) VALUES (?,?,?,?,?)', [bookCode, bookName, bookType || null, testament || '新约', bookMap.size+1]);
        bookMap.set(bookName, bres.insertId);
        // store id mapping
        bookMap.set(bookName+'_id', bres.insertId);
      }
    }

    // second pass insert verses preserving order and line_index per chapter
    for (let i=0;i<rows.length;i++){
      const r = rows[i];
      const bookName = r['卷名'] || r['卷名'] || r['书卷'] || '';
      const chapterRaw = String(r['章'] || '').trim();
      const verseRaw = String(r['节'] || '').trim();
      const text = String(r['经文内容'] || r['经文内容'] || '').trim();
      const bookId = bookMap.get(bookName+'_id');
      let chapter = parseInt(chapterRaw,10);
      if (!Number.isFinite(chapter)) chapter = 0; // store 0 for null/empty
      const verse_ref = verseRaw === '' ? null : verseRaw;
      const key = `${translationId}_${bookId}_${chapter}`;
      lastLineIndex[key] = (lastLineIndex[key] || 0) + 1;
      const line_index = lastLineIndex[key];
      const content_hash = require('crypto').createHash('sha256').update(text||'').digest('hex');
      const type = verse_ref ? 'verse' : 'note';
      await conn.execute('INSERT INTO verses (translation_id,book_id,chapter,verse_ref,line_index,type,text,content_hash,original_row) VALUES (?,?,?,?,?,?,?,?,?)', [translationId, bookId, chapter, verse_ref, line_index, type, text, content_hash, i+1]);
    }

    await conn.commit();
    await conn.release();
    res.render('admin', { message: `Imported ${rows.length} rows` });
  }catch(e){
    await conn.rollback();
    await conn.release();
    console.error(e);
    res.render('admin', { message: `Error: ${e.message}` });
  }
});

// public: list books
app.get('/', async (req,res)=>{
  const pool = await getConn();
  const [books] = await pool.query('SELECT id, code, name_cn, book_type FROM books ORDER BY order_index');
  res.render('index', { books });
});

// view book chapters (list chapters present)
app.get('/book/:bookId', async (req,res)=>{
  const pool = await getConn();
  const bookId = Number(req.params.bookId);
  const [rows] = await pool.query('SELECT DISTINCT chapter FROM verses WHERE book_id=? ORDER BY chapter', [bookId]);
  res.render('book', { chapters: rows, bookId });
});

// view chapter verses
app.get('/book/:bookId/chapter/:chapter', async (req,res)=>{
  const pool = await getConn();
  const bookId = Number(req.params.bookId);
  const chapter = Number(req.params.chapter);
  const [verses] = await pool.query('SELECT * FROM verses WHERE book_id=? AND chapter=? ORDER BY line_index', [bookId, chapter]);
  res.render('chapter', { verses, bookId, chapter });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`App listening on ${PORT}`));
