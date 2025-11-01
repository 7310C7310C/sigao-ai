const mysql = require('mysql2/promise');
async function run(){
  const conn = await mysql.createConnection({host:'127.0.0.1',user:'sigao',password:'sigao',database:'sigao_ai'});
  const [rows] = await conn.execute("SHOW CREATE TABLE books");
  console.log(rows[0]['Create Table']);
  await conn.end();
}
run().catch(e=>{console.error(e);process.exit(1)});
