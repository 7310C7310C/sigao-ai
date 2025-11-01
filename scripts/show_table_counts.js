const mysql = require('mysql2/promise');
(async function(){
  const conn = await mysql.createConnection({host:'127.0.0.1',user:'sigao',password:'sigao',database:'sigao_ai'});
  const tables = ['translations','books','verses','ai_responses_cache'];
  for (const t of tables) {
    try{
      const [r] = await conn.execute(`SELECT COUNT(*) AS cnt FROM \`${t}\``);
      console.log(`${t}: ${r[0].cnt}`);
    }catch(e){
      console.log(`${t}: ERROR (${e.message})`);
    }
  }
  await conn.end();
})().catch(e=>{console.error(e);process.exit(1)});
