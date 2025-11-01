require('dotenv').config();

module.exports = {
  admin: {
    username: 'admin',
    password: process.env.ADMIN_PASS || 'admin'
  }
};
