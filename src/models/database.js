const mysql = require('mysql2/promise');
const dbConfig = require('../../config/database');

let pool = null;

/**
 * 获取数据库连接池（单例模式）
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    
    // 监听连接建立事件，设置时区为中国时区
    pool.on('connection', function(connection) {
      connection.query("SET time_zone = '+08:00'", function(err) {
        if (err) {
          console.error('[Database] 设置时区失败:', err.message);
        }
      });
    });
  }
  return pool;
}

/**
 * 获取一个数据库连接
 */
async function getConnection() {
  const pool = getPool();
  return await pool.getConnection();
}

/**
 * 执行查询
 */
async function query(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * 执行预处理语句
 */
async function execute(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * 关闭连接池
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  getConnection,
  query,
  execute,
  closePool
};
