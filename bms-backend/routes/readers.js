const express = require('express');
const router = express.Router();
const pool = require('../db');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { parsePagination, validatePhone } = require('../utils/validator');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

router.get('/readers', asyncHandler(async (req, res) => {
  const { page, pageSize, offset } = parsePagination(req.query);
  const { r_name, class: className } = req.query;

  let whereClauses = [];
  let params = [];
  if (r_name) { whereClauses.push('r_name LIKE ?'); params.push(`%${r_name}%`); }
  if (className) { whereClauses.push('class LIKE ?'); params.push(`%${className}%`); }

  const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM reader ${whereStr}`, params
  );
  const total = countResult[0].total;

  const [rows] = await pool.query(
    `SELECT reader_id, r_name, class, phone, max_book, status FROM reader ${whereStr} ORDER BY reader_id LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  res.json({ code: 200, data: { list: rows, total, page, pageSize } });
}));

router.post('/readers', asyncHandler(async (req, res) => {
  const { reader_id, r_name, class: className, phone, max_book, status } = req.body;
  if (!reader_id || !r_name || !className) {
    throw new AppError('学号、姓名、班级为必填项', 400);
  }
  if (phone && !validatePhone(phone)) {
    throw new AppError('手机号格式不正确', 400);
  }
  const rawPwd = req.body.pwd || '123456';
  const hashedPwd = await bcrypt.hash(rawPwd, SALT_ROUNDS);
  try {
    await pool.query(
      `INSERT INTO reader (reader_id, r_name, class, phone, pwd, max_book, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reader_id, r_name, className, phone || null, hashedPwd, max_book || 5, status !== undefined ? status : 1]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('学号已存在', 400);
    }
    throw err;
  }
  res.json({ code: 200, message: '新增成功' });
}));

router.put('/readers/:reader_id', asyncHandler(async (req, res) => {
  const { r_name, class: className, phone, max_book, status, pwd } = req.body;
  const { reader_id } = req.params;

  if (phone && !validatePhone(phone)) {
    throw new AppError('手机号格式不正确', 400);
  }

  let fields = [];
  let params = [];

  if (r_name !== undefined) { fields.push('r_name=?'); params.push(r_name); }
  if (className !== undefined) { fields.push('class=?'); params.push(className); }
  if (phone !== undefined) { fields.push('phone=?'); params.push(phone || null); }
  if (max_book !== undefined) { fields.push('max_book=?'); params.push(max_book); }
  if (status !== undefined) { fields.push('status=?'); params.push(status); }
  if (pwd !== undefined && pwd !== '') {
    const hashedPwd = await bcrypt.hash(pwd, SALT_ROUNDS);
    fields.push('pwd=?'); params.push(hashedPwd);
  }

  if (fields.length === 0) {
    throw new AppError('没有需要更新的字段', 400);
  }

  params.push(reader_id);
  await pool.query(`UPDATE reader SET ${fields.join(', ')} WHERE reader_id=?`, params);
  res.json({ code: 200, message: '修改成功' });
}));

router.delete('/readers/:reader_id', asyncHandler(async (req, res) => {
  const [borrows] = await pool.query('SELECT COUNT(*) AS cnt FROM borrow WHERE reader_id=? AND is_back=0', [req.params.reader_id]);
  if (borrows[0].cnt > 0) {
    throw new AppError('该读者有未还图书，无法删除', 400);
  }
  await pool.query('DELETE FROM reader WHERE reader_id=?', [req.params.reader_id]);
  res.json({ code: 200, message: '删除成功' });
}));

module.exports = router;
