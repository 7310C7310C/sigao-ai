const crypto = require('crypto');

/**
 * 生成内容的 SHA256 哈希
 */
function generateContentHash(content) {
  return crypto.createHash('sha256').update(content || '').digest('hex');
}

module.exports = {
  generateContentHash
};
