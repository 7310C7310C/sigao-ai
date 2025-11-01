const { query, execute } = require('./database');

/**
 * 经卷模型
 */
class Book {
  /**
   * 获取所有经卷
   */
  static async findAll() {
    const [rows] = await query(
      'SELECT id, code, name_cn, book_type FROM books ORDER BY order_index'
    );
    return rows;
  }

  /**
   * 根据 ID 获取经卷
   */
  static async findById(id) {
    const [rows] = await execute(
      'SELECT * FROM books WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  /**
   * 创建经卷
   */
  static async create(bookData) {
    const { code, name_cn, book_type, testament, order_index } = bookData;
    const [result] = await execute(
      'INSERT INTO books (code, name_cn, book_type, testament, order_index) VALUES (?, ?, ?, ?, ?)',
      [code, name_cn, book_type, testament, order_index]
    );
    return result.insertId;
  }

  /**
   * 清空经卷表
   */
  static async truncate() {
    await query('TRUNCATE TABLE books');
  }
}

module.exports = Book;
