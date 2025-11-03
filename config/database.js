require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'sigao',
  password: process.env.DB_PASS || 'sigao',
  database: process.env.DB_NAME || 'sigao_ai',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 设置时区为中国时区（UTC+8），所有时间函数（NOW(), CURRENT_TIMESTAMP）将返回中国时间
  timezone: '+08:00'
};
