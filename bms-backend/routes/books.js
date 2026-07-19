const express = require('express');
const router = express.Router();
const pool = require('../db');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/validator');

router.get('/books', asyncHandler(async (req, res) => {
  const { page, pageSize, offset } = parsePagination(req.query);
  const { book_name, author, cate_id } = req.query;

  let whereClauses = [];
  let params = [];
  if (book_name) { whereClauses.push('b.book_name LIKE ?'); params.push(`%${book_name}%`); }
  if (author) { whereClauses.push('b.author LIKE ?'); params.push(`%${author}%`); }
  if (cate_id) { whereClauses.push('b.cate_id = ?'); params.push(cate_id); }

  const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM book b ${whereStr}`, params
  );
  const total = countResult[0].total;

  const [rows] = await pool.query(
    `SELECT b.*, c.cate_name FROM book b
       LEFT JOIN category c ON b.cate_id = c.cate_id
       ${whereStr}
       ORDER BY b.book_id
       LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  res.json({ code: 200, data: { list: rows, total, page, pageSize } });
}));

router.post('/books', asyncHandler(async (req, res) => {
  const { book_id, book_name, author, press, pub_date, price, stock, cate_id } = req.body;
  if (!book_id || !book_name || !author) {
    throw new AppError('图书编号、名称、作者为必填项', 400);
  }
  if (stock !== undefined && stock < 0) {
    throw new AppError('库存不能为负数', 400);
  }

  const [existing] = await pool.query('SELECT book_id FROM book WHERE book_id = ?', [book_id]);
  if (existing.length > 0) {
    throw new AppError('图书编号已存在', 400);
  }

  await pool.query(
    `INSERT INTO book (book_id, book_name, author, press, pub_date, price, stock, cate_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [book_id, book_name, author, press || null, pub_date || null, price || null, stock || 0, cate_id || null]
  );
  res.json({ code: 200, message: '新增成功' });
}));

router.put('/books/:book_id', asyncHandler(async (req, res) => {
  const { book_id } = req.params;
  const { book_name, author, press, pub_date, price, stock, cate_id } = req.body;
  if (stock !== undefined && stock < 0) {
    throw new AppError('库存不能为负数', 400);
  }
  await pool.query(
    `UPDATE book SET book_name=?, author=?, press=?, pub_date=?, price=?, stock=?, cate_id=?
       WHERE book_id=?`,
    [book_name, author, press || null, pub_date || null, price || null, stock || 0, cate_id || null, book_id]
  );
  res.json({ code: 200, message: '修改成功' });
}));

router.delete('/books/:book_id', asyncHandler(async (req, res) => {
  const [borrows] = await pool.query('SELECT COUNT(*) AS cnt FROM borrow WHERE book_id=? AND is_back=0', [req.params.book_id]);
  if (borrows[0].cnt > 0) {
    throw new AppError('该图书有未归还记录，无法删除', 400);
  }
  await pool.query('DELETE FROM book WHERE book_id=?', [req.params.book_id]);
  res.json({ code: 200, message: '删除成功' });
}));

module.exports = router;
