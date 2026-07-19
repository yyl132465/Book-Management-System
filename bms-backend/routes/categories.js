const express = require('express');
const router = express.Router();
const pool = require('../db');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

router.get('/categories', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM category ORDER BY cate_id');
  res.json({ code: 200, data: rows });
}));

router.post('/categories', asyncHandler(async (req, res) => {
  const { cate_name } = req.body;
  if (!cate_name) throw new AppError('分类名称不能为空', 400);
  try {
    await pool.query('INSERT INTO category (cate_name) VALUES (?)', [cate_name]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('分类名称已存在', 400);
    }
    throw err;
  }
  res.json({ code: 200, message: '新增成功' });
}));

router.put('/categories/:cate_id', asyncHandler(async (req, res) => {
  const { cate_name } = req.body;
  if (!cate_name) throw new AppError('分类名称不能为空', 400);
  try {
    await pool.query('UPDATE category SET cate_name=? WHERE cate_id=?', [cate_name, req.params.cate_id]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('分类名称已存在', 400);
    }
    throw err;
  }
  res.json({ code: 200, message: '修改成功' });
}));

router.delete('/categories/:cate_id', asyncHandler(async (req, res) => {
  const [books] = await pool.query('SELECT COUNT(*) AS cnt FROM book WHERE cate_id=?', [req.params.cate_id]);
  if (books[0].cnt > 0) {
    throw new AppError('该分类下有图书，无法删除', 400);
  }
  await pool.query('DELETE FROM category WHERE cate_id=?', [req.params.cate_id]);
  res.json({ code: 200, message: '删除成功' });
}));

module.exports = router;
