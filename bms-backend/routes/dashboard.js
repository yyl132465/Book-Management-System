const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/dashboard', async (req, res) => {
  try {
    const [[{ total_books }]] = await pool.query('SELECT COUNT(*) AS total_books FROM book');
    const [[{ total_readers }]] = await pool.query('SELECT COUNT(*) AS total_readers FROM reader');
    const [[{ borrowing_count }]] = await pool.query('SELECT COUNT(*) AS borrowing_count FROM borrow WHERE is_back = 0');
    const [[{ overdue_count }]] = await pool.query(
      'SELECT COUNT(*) AS overdue_count FROM borrow WHERE is_back = 0 AND over_day > 0'
    );
    res.json({
      code: 200,
      data: { total_books, total_readers, borrowing_count, overdue_count }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
