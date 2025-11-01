const mysql = require('mysql2/promise');
require('dotenv').config();

async function run(){
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'sigao',
    password: process.env.DB_PASS || 'sigao',
    database: process.env.DB_NAME || 'sigao_ai'
  });
  console.log('Clearing tables: ai_responses_cache, verses, books, translations');
  await conn.execute('SET FOREIGN_KEY_CHECKS=0');
  const tables = ['ai_responses_cache','verses','books','translations'];
  for (const t of tables) {
    try{
      await conn.execute(`TRUNCATE TABLE \`${t}\``);
      console.log(`Truncated ${t}`);
    }catch(e){
      console.log(`Skipping ${t} (maybe not exists): ${e.message}`);
    }
  }
  await conn.execute('SET FOREIGN_KEY_CHECKS=1');
  await conn.end();
  console.log('Done.');
}
run().catch(e=>{console.error(e);process.exit(1)});
