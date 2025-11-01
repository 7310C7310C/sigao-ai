const mysql = require('mysql2/promise');
async function run(){
  const conn = await mysql.createConnection({host:'127.0.0.1',user:'sigao',password:'sigao',database:'sigao_ai'});
  console.log('Altering books.testament to VARCHAR to avoid enum encoding issues...');
  await conn.execute("ALTER TABLE books MODIFY COLUMN testament VARCHAR(16) DEFAULT '新约'");
  const [rows] = await conn.execute("SHOW CREATE TABLE books");
  console.log(rows[0]['Create Table']);
  await conn.end();
}
run().catch(e=>{console.error(e);process.exit(1)});
