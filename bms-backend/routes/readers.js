const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/readers
router.get('/readers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { r_name, class: className } = req.query;
    const offset = (page - 1) * pageSize;

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
      `SELECT * FROM reader ${whereStr} ORDER BY reader_id LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    res.json({ code: 200, data: { list: rows, total, page, pageSize } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// POST /api/readers
router.post('/readers', async (req, res) => {
  try {
    const { reader_id, r_name, class: className, phone, max_book, status } = req.body;
    if (!reader_id || !r_name || !className) {
      return res.status(400).json({ code: 400, message: '学号、姓名、班级为必填项' });
    }
    const pwd = req.body.pwd || '123456';
    await pool.query(
      `INSERT INTO reader (reader_id, r_name, class, phone, pwd, max_book, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reader_id, r_name, className, phone || null, pwd, max_book || 5, status !== undefined ? status : 1]
    );
    res.json({ code: 200, message: '新增成功' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '学号已存在' });
    }
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// PUT /api/readers/:reader_id
router.put('/readers/:reader_id', async (req, res) => {
  try {
    const { r_name, class: className, phone, max_book, status } = req.body;
    await pool.query(
      `UPDATE reader SET r_name=?, class=?, phone=?, max_book=?, status=? WHERE reader_id=?`,
      [r_name, className, phone || null, max_book || 5, status !== undefined ? status : 1, req.params.reader_id]
    );
    res.json({ code: 200, message: '修改成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// DELETE /api/readers/:reader_id
router.delete('/readers/:reader_id', async (req, res) => {
  try {
    const [borrows] = await pool.query('SELECT COUNT(*) AS cnt FROM borrow WHERE reader_id=? AND is_back=0', [req.params.reader_id]);
    if (borrows[0].cnt > 0) {
      return res.status(400).json({ code: 400, message: '该读者有未还图书，无法删除' });
    }
    await pool.query('DELETE FROM reader WHERE reader_id=?', [req.params.reader_id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
