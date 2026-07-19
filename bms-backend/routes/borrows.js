const express = require('express');
const router = express.Router();
const pool = require('../db');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/validator');
const { borrowBook, returnBook, renewBook } = require('../services/borrowService');

router.get('/borrows', asyncHandler(async (req, res) => {
  const { page, pageSize, offset } = parsePagination(req.query);
  const { book_name, reader_name, is_back } = req.query;

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
}));

router.post('/borrows', asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { book_id, reader_id } = req.body;
    await borrowBook(conn, book_id, reader_id);
    await conn.commit();
    res.json({ code: 200, message: '借阅成功' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.put('/borrows/:borrow_id/return', asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { borrow_id } = req.params;
    const result = await returnBook(conn, borrow_id);
    await conn.commit();
    res.json({ code: 200, message: result.message, data: { over_day: result.over_day } });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.put('/borrows/:borrow_id/renew', asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { borrow_id } = req.params;
    const result = await renewBook(conn, borrow_id);
    await conn.commit();
    res.json({ code: 200, message: result.message, data: result });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.get('/borrows/overdue', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('CALL proc_over_reader()');
  res.json({ code: 200, data: rows[0] || rows });
}));

module.exports = router;
