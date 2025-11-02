const { query, execute } = require('./database');

/**
 * 译本模型
 */
class Translation {
  /**
   * 获取所有译本
   */
  static async findAll() {
    const rows = await query('SELECT * FROM translations');
    return rows;
  }

  /**
   * 根据 ID 获取译本
   */
  static async findById(id) {
    const rows = await execute(
      'SELECT * FROM translations WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  /**
   * 根据代码获取译本
   */
  static async findByCode(code) {
    const rows = await execute(
      'SELECT * FROM translations WHERE code = ?',
      [code]
    );
    return rows[0];
  }

  /**
   * 创建译本
   */
  static async create(code, name, lang) {
    const result = await execute(
      'INSERT INTO translations (code, name, lang) VALUES (?, ?, ?)',
      [code, name, lang]
    );
    return result.insertId;
  }

  /**
   * 清空译本表
   */
  static async truncate() {
    await query('TRUNCATE TABLE translations');
  }
}

module.exports = Translation;
