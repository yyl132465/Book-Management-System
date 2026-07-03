const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/reader/register
router.post('/reader/register', async (req, res) => {
  try {
    const { reader_id, r_name, class: className, phone, pwd } = req.body;
    if (!reader_id || !r_name || !className || !pwd) {
      return res.status(400).json({ code: 400, message: '学号、姓名、班级、密码为必填项' });
    }

    const [existing] = await pool.query('SELECT reader_id FROM reader WHERE reader_id = ?', [reader_id]);
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该学号已被注册' });
    }

    await pool.query(
      `INSERT INTO reader (reader_id, r_name, class, phone, pwd, max_book, status) VALUES (?, ?, ?, ?, ?, 5, 1)`,
      [reader_id, r_name, className, phone || null, pwd]
    );
    res.json({ code: 200, message: '注册成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// POST /api/reader/login
router.post('/reader/login', async (req, res) => {
  try {
    const { reader_id, pwd } = req.body;
    if (!reader_id || !pwd) {
      return res.status(400).json({ code: 400, message: '请输入学号和密码' });
    }
    const [rows] = await pool.query(
      'SELECT reader_id, r_name, class, phone, max_book, status FROM reader WHERE reader_id = ? AND pwd = ?',
      [reader_id, pwd]
    );
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, message: '学号或密码错误' });
    }
    const reader = rows[0];
    if (reader.status === 0) {
      return res.status(403).json({ code: 403, message: '该账户已被禁用，请联系管理员' });
    }

    const token = Buffer.from(JSON.stringify({
      reader_id: reader.reader_id,
      r_name: reader.r_name
    })).toString('base64');

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        reader_id: reader.reader_id,
        r_name: reader.r_name,
        class: reader.class,
        max_book: reader.max_book
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
