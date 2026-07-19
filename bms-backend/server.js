require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pool = require('./db');
const { asyncHandler } = require('./middleware/errorHandler');
const { parsePagination } = require('./utils/validator');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const categoryRoutes = require('./routes/categories');
const readerRoutes = require('./routes/readers');
const borrowRoutes = require('./routes/borrows');
const dashboardRoutes = require('./routes/dashboard');
const readerAuthRoutes = require('./routes/reader-auth');
const readerBorrowRoutes = require('./routes/reader-borrow');
const { adminAuth } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  message: { code: 429, message: '登录尝试次数过多，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/login', loginLimiter);
app.use('/api/reader/login', loginLimiter);
app.use('/api/reader/register', loginLimiter);

app.use('/api', authRoutes);
app.use('/api', readerAuthRoutes);
app.use('/api', readerBorrowRoutes);

app.get('/api/books', asyncHandler(async (req, res) => {
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

app.get('/api/categories', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM category ORDER BY cate_id');
  res.json({ code: 200, data: rows });
}));

app.use('/api', adminAuth, bookRoutes);
app.use('/api', adminAuth, categoryRoutes);
app.use('/api', adminAuth, readerRoutes);
app.use('/api', adminAuth, borrowRoutes);
app.use('/api', adminAuth, dashboardRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`BMS Backend running on http://localhost:${PORT}`);
});
