require('dotenv').config();
const pool = require('./db');

(async () => {
  try {
    await pool.query(
      'ALTER TABLE borrow ADD COLUMN due_date date DEFAULT NULL COMMENT \'应还日期\' AFTER borrow_time'
    );
    console.log('due_date 字段已添加');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('due_date 字段已存在，跳过添加');
    } else {
      console.error('添加字段失败:', e.message);
      process.exit(1);
    }
  }

  try {
    const [rows] = await pool.query(
      'SELECT borrow_id, borrow_time FROM borrow WHERE is_back = 0 AND due_date IS NULL'
    );
    console.log('需要更新的未还记录:', rows.length);

    for (const row of rows) {
      const borrowDate = new Date(row.borrow_time);
      const dueDate = new Date(borrowDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const dueStr = dueDate.toISOString().slice(0, 10);
      await pool.query('UPDATE borrow SET due_date = ? WHERE borrow_id = ?', [dueStr, row.borrow_id]);
    }

    const [backRows] = await pool.query(
      'SELECT borrow_id, borrow_time FROM borrow WHERE is_back = 1 AND due_date IS NULL'
    );
    console.log('需要更新的已还记录:', backRows.length);

    for (const row of backRows) {
      const borrowDate = new Date(row.borrow_time);
      const dueDate = new Date(borrowDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const dueStr = dueDate.toISOString().slice(0, 10);
      await pool.query('UPDATE borrow SET due_date = ? WHERE borrow_id = ?', [dueStr, row.borrow_id]);
    }

    console.log('所有记录的 due_date 已设置完成');
    process.exit(0);
  } catch (e) {
    console.error('更新数据失败:', e.message);
    process.exit(1);
  }
})();
