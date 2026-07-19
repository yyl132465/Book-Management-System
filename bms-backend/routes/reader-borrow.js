const express = require('express');
const router = express.Router();
const pool = require('../db');
const { readerAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/validator');
const { borrowBook, returnBook, renewBook } = require('../services/borrowService');

router.get('/reader/my-borrows', readerAuth, asyncHandler(async (req, res) => {
  const { reader_id } = req.reader;
  const { page, pageSize, offset } = parsePagination(req.query);
  const { is_back } = req.query;

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
}));

router.post('/reader/borrow', readerAuth, asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { reader_id } = req.reader;
    const { book_id } = req.body;
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

router.put('/reader/return/:borrow_id', readerAuth, asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { reader_id } = req.reader;
    const { borrow_id } = req.params;
    const result = await returnBook(conn, borrow_id, reader_id);
    await conn.commit();
    res.json({ code: 200, message: result.message, data: { over_day: result.over_day } });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.put('/reader/renew/:borrow_id', readerAuth, asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { reader_id } = req.reader;
    const { borrow_id } = req.params;
    const result = await renewBook(conn, borrow_id, reader_id);
    await conn.commit();
    res.json({ code: 200, message: result.message, data: result });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
