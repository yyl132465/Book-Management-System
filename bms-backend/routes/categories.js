const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM category ORDER BY cate_id');
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// POST /api/categories
router.post('/categories', async (req, res) => {
  try {
    const { cate_name } = req.body;
    if (!cate_name) return res.status(400).json({ code: 400, message: '分类名称不能为空' });
    await pool.query('INSERT INTO category (cate_name) VALUES (?)', [cate_name]);
    res.json({ code: 200, message: '新增成功' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '分类名称已存在' });
    }
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// PUT /api/categories/:cate_id
router.put('/categories/:cate_id', async (req, res) => {
  try {
    const { cate_name } = req.body;
    if (!cate_name) return res.status(400).json({ code: 400, message: '分类名称不能为空' });
    await pool.query('UPDATE category SET cate_name=? WHERE cate_id=?', [cate_name, req.params.cate_id]);
    res.json({ code: 200, message: '修改成功' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '分类名称已存在' });
    }
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// DELETE /api/categories/:cate_id
router.delete('/categories/:cate_id', async (req, res) => {
  try {
    const [books] = await pool.query('SELECT COUNT(*) AS cnt FROM book WHERE cate_id=?', [req.params.cate_id]);
    if (books[0].cnt > 0) {
      return res.status(400).json({ code: 400, message: '该分类下有图书，无法删除' });
    }
    await pool.query('DELETE FROM category WHERE cate_id=?', [req.params.cate_id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
