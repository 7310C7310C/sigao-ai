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

  try{
    console.log('Attempting to DROP TABLE IF EXISTS `import_staging`');
    const [res] = await conn.execute('DROP TABLE IF EXISTS `import_staging`');
    console.log('DROP executed. Verifying...');
    const [rows] = await conn.execute("SHOW TABLES LIKE 'import_staging'");
    if (rows.length === 0) {
      console.log('Verified: `import_staging` does not exist.');
    } else {
      console.log('Warning: `import_staging` still exists:', rows);
    }
  }catch(e){
    console.error('Error dropping import_staging:', e.message);
    process.exitCode = 2;
  }finally{
    await conn.end();
  }
}

run().catch(e=>{console.error(e); process.exit(1)});
