const express = require('express');
const router = express.Router();
const pool = require('../db');

// 读者 token 解析中间件
function readerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  try {
    const payload = JSON.parse(Buffer.from(authHeader.slice(7), 'base64').toString('utf-8'));
    if (!payload.reader_id) throw new Error('Invalid token');
    req.reader = payload;
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, message: 'token 无效' });
  }
}

// GET /api/reader/my-borrows
router.get('/reader/my-borrows', readerAuth, async (req, res) => {
  try {
    const { reader_id } = req.reader;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { is_back } = req.query;
    const offset = (page - 1) * pageSize;

    let whereStr = 'WHERE b.reader_id = ?';
    let params = [reader_id];
    if (is_back !== undefined && is_back !== '') {
      whereStr += ' AND b.is_back = ?';
      params.push(is_back);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM borrow b ${whereStr}`, params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT b.*, bo.book_name, bo.author, bo.press
       FROM borrow b
       JOIN book bo ON b.book_id = bo.book_id
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

// POST /api/reader/borrow - 读者借书
router.post('/reader/borrow', readerAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { reader_id } = req.reader;
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ code: 400, message: '请选择图书' });
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
      return res.status(400).json({ code: 400, message: '账户已被禁用' });
    }

    // 校验未还数量
    const [borrowCount] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM borrow WHERE reader_id = ? AND is_back = 0',
      [reader_id]
    );
    if (borrowCount[0].cnt >= reader.max_book) {
      await conn.rollback();
      return res.status(400).json({ code: 400, message: `已达到最大借阅数量(${reader.max_book}本)` });
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
      return res.status(400).json({ code: 400, message: '库存不足' });
    }

    // 检查重复借阅
    const [dupCheck] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM borrow WHERE book_id=? AND reader_id=? AND is_back=0',
      [book_id, reader_id]
    );
    if (dupCheck[0].cnt > 0) {
      await conn.rollback();
      return res.status(400).json({ code: 400, message: '已借阅该书且尚未归还' });
    }

    const today = new Date().toISOString().slice(0, 10);
    await conn.query(
      'INSERT INTO borrow (book_id, reader_id, borrow_time, over_day, is_back) VALUES (?, ?, ?, 0, 0)',
      [book_id, reader_id, today]
    );
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

// PUT /api/reader/return/:borrow_id - 读者还书
router.put('/reader/return/:borrow_id', readerAuth, async (req, res) => {
  try {
    const { reader_id } = req.reader;
    const { borrow_id } = req.params;
    const today = new Date().toISOString().slice(0, 10);

    const [records] = await pool.query('SELECT * FROM borrow WHERE borrow_id = ?', [borrow_id]);
    if (records.length === 0) {
      return res.status(400).json({ code: 400, message: '借阅记录不存在' });
    }
    const record = records[0];
    if (record.reader_id !== reader_id) {
      return res.status(403).json({ code: 403, message: '无权操作该借阅记录' });
    }
    if (record.is_back === 1) {
      return res.status(400).json({ code: 400, message: '该书记归还' });
    }

    await pool.query(
      'UPDATE borrow SET is_back = 1, return_time = ? WHERE borrow_id = ?',
      [today, borrow_id]
    );
    res.json({ code: 200, message: '还书成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
