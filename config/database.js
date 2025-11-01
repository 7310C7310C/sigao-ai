require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'sigao',
  password: process.env.DB_PASS || 'sigao',
  database: process.env.DB_NAME || 'sigao_ai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
