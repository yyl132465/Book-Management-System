const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/borrows
router.get('/borrows', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { book_name, reader_name, is_back } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClauses = [];
    let params = [];
    if (book_name) { whereClauses.push('bo.book_name LIKE ?'); params.push(`%${book_name}%`); }
    if (reader_name) { whereClauses.push('r.r_name LIKE ?'); params.push(`%${reader_name}%`); }
    if (is_back !== undefined && is_back !== '') { whereClauses.push('b.is_back = ?'); params.push(is_back); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM borrow b
       JOIN book bo ON b.book_id = bo.book_id
       JOIN reader r ON b.reader_id = r.reader_id
       ${whereStr}`, params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT b.*, bo.book_name, r.r_name AS reader_name, r.class AS reader_class
       FROM borrow b
       JOIN book bo ON b.book_id = bo.book_id
       JOIN reader r ON b.reader_id = r.reader_id
       ${whereStr}
       ORDER BY b.borrow_id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    res.json({ code: 200, data: { list: rows, total, page, pageSize } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// POST /api/borrows - 借书
router.post('/borrows', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { book_id, reader_id } = req.body;
    if (!book_id || !reader_id) {
      return res.status(400).json({ code: 400, message: '请选择图书和读者' });
    }

    // 校验读者状态
    const [readers] = await conn.query('SELECT * FROM reader WHERE reader_id = ?', [reader_id]);
    if (readers.length === 0) {
      await conn.rollback();
      return res.status(400).json({ code: 400, message: '读者不存在' });
    }
    const reader = readers[0];
    if (reader.status === 0) {
      await conn.rollback();
      return res.status(400).json({ code: 400, message: '该读者账户已被禁用' });
    }

    // 校验未还数量
    const [borrowCount] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM borrow WHERE reader_id = ? AND is_back = 0',
      [reader_id]
    );
    if (borrowCount[0].cnt >= reader.max_book) {
      await conn.rollback();
      return res.status(400).json({ code: 400, message: `该读者已达到最大借阅数量(${reader.max_book}本)` });
    }

    // 校验图书库存
    const [books] = await conn.query('SELECT * FROM book WHERE book_id = ?', [book_id]);
    if (books.length === 0) {
      await conn.rollback();
      return res.status(400).json({ code: 400, message: '图书不存在' });
    }
    const book = books[0];
    if (book.stock <= 0) {
      await conn.rollback();
      return res.status(400).json({ code: 400, message: '该图书库存不足' });
    }

    // 检查是否重复借同一本书（未还）
    const [dupCheck] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM borrow WHERE book_id=? AND reader_id=? AND is_back=0',
      [book_id, reader_id]
    );
    if (dupCheck[0].cnt > 0) {
      await conn.rollback();
      return res.status(400).json({ code: 400, message: '该读者已借阅此图书且尚未归还' });
    }

    // 插入借阅记录
    const today = new Date().toISOString().slice(0, 10);
    await conn.query(
      'INSERT INTO borrow (book_id, reader_id, borrow_time, over_day, is_back) VALUES (?, ?, ?, 0, 0)',
      [book_id, reader_id, today]
    );

    // 库存 -1
    await conn.query('UPDATE book SET stock = stock - 1 WHERE book_id = ?', [book_id]);

    await conn.commit();
    res.json({ code: 200, message: '借阅成功' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  } finally {
    conn.release();
  }
});

// PUT /api/borrows/:borrow_id/return - 还书
router.put('/borrows/:borrow_id/return', async (req, res) => {
  try {
    const { borrow_id } = req.params;
    const today = new Date().toISOString().slice(0, 10);

    const [records] = await pool.query('SELECT * FROM borrow WHERE borrow_id = ?', [borrow_id]);
    if (records.length === 0) {
      return res.status(400).json({ code: 400, message: '借阅记录不存在' });
    }
    if (records[0].is_back === 1) {
      return res.status(400).json({ code: 400, message: '该记录已归还' });
    }

    await pool.query(
      'UPDATE borrow SET is_back = 1, return_time = ? WHERE borrow_id = ?',
      [today, borrow_id]
    );
    // 触发器 tri_return_book 会自动 stock+1
    res.json({ code: 200, message: '还书成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// GET /api/borrows/overdue
router.get('/borrows/overdue', async (req, res) => {
  try {
    const [rows] = await pool.query('CALL proc_over_reader()');
    // mysql2 返回 [rows, fields] 或 [rows, ...]
    res.json({ code: 200, data: rows[0] || rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
