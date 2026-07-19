require('dotenv').config();
const pool = require('./db');

async function migrate() {
  try {
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'borrow' AND COLUMN_NAME = 'renew_count'
    `);

    if (cols.length > 0) {
      console.log('renew_count 字段已存在，跳过');
    } else {
      await pool.query(`
        ALTER TABLE borrow
        ADD COLUMN renew_count INT DEFAULT 0 COMMENT '续借次数'
        AFTER due_date
      `);
      console.log('✅ 已添加 renew_count 字段到 borrow 表');
    }

    process.exit(0);
  } catch (err) {
    console.error('迁移失败:', err.message);
    process.exit(1);
  }
}

migrate();
