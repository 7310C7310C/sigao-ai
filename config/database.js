require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'sigao',
  password: process.env.DB_PASS || 'sigao',
  database: process.env.DB_NAME || 'sigao_ai',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 连接选项
  connectionOptions: {
    charset: 'utf8mb4',
    sql_mode: 'TRADITIONAL'
  }
};
