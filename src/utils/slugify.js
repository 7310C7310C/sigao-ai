/**
 * 将书名转换为代码（slug）
 */
function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

module.exports = {
  slugify
};
