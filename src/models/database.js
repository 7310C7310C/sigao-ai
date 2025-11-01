const mysql = require('mysql2/promise');
const dbConfig = require('../../config/database');

let pool = null;

/**
 * 获取数据库连接池（单例模式）
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
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
  return await pool.query(sql, params);
}

/**
 * 执行预处理语句
 */
async function execute(sql, params = []) {
  const pool = getPool();
  return await pool.execute(sql, params);
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
