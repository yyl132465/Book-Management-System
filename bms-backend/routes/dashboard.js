const express = require('express');
const router = express.Router();
const pool = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/dashboard', asyncHandler(async (req, res) => {
  const [[{ total_books }]] = await pool.query('SELECT COUNT(*) AS total_books FROM book');
  const [[{ total_readers }]] = await pool.query('SELECT COUNT(*) AS total_readers FROM reader');
  const [[{ borrowing_count }]] = await pool.query('SELECT COUNT(*) AS borrowing_count FROM borrow WHERE is_back = 0');
  const [[{ overdue_count }]] = await pool.query(
    'SELECT COUNT(*) AS overdue_count FROM borrow WHERE is_back = 0 AND due_date IS NOT NULL AND due_date < CURDATE()'
  );

  const [categoryStats] = await pool.query(`
    SELECT c.cate_name, COUNT(b.book_id) AS count
    FROM category c
    LEFT JOIN book b ON c.cate_id = b.cate_id
    GROUP BY c.cate_id, c.cate_name
    ORDER BY count DESC
  `);

  const [borrowTrend] = await pool.query(`
    SELECT 
      DATE_FORMAT(borrow_time, '%Y-%m-%d') AS date,
      COUNT(*) AS count
    FROM borrow
    WHERE borrow_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE_FORMAT(borrow_time, '%Y-%m-%d')
    ORDER BY date ASC
  `);

  const [popularBooks] = await pool.query(`
    SELECT bo.book_name, COUNT(*) AS borrow_count
    FROM borrow b
    JOIN book bo ON b.book_id = bo.book_id
    GROUP BY b.book_id, bo.book_name
    ORDER BY borrow_count DESC
    LIMIT 10
  `);

  const [readerRanking] = await pool.query(`
    SELECT r.r_name, r.class, COUNT(*) AS borrow_count
    FROM borrow b
    JOIN reader r ON b.reader_id = r.reader_id
    GROUP BY b.reader_id, r.r_name, r.class
    ORDER BY borrow_count DESC
    LIMIT 10
  `);

  res.json({
    code: 200,
    data: {
      total_books,
      total_readers,
      borrowing_count,
      overdue_count,
      categoryStats,
      borrowTrend,
      popularBooks,
      readerRanking
    }
  });
}));

module.exports = router;
