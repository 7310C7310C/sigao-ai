require('dotenv').config();

module.exports = {
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASS || 'admin'
  }
};
