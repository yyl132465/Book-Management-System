const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

router.post('/login', async (req, res) => {
  try {
    const { admin_name, pwd } = req.body;
    if (!admin_name || !pwd) {
      return res.status(400).json({ code: 400, message: '请输入管理员账号和密码' });
    }
    const [rows] = await pool.query(
      'SELECT admin_id, admin_name, pwd FROM admin WHERE admin_name = ?',
      [admin_name]
    );
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, message: '账号或密码错误' });
    }
    const admin = rows[0];
    const isPasswordValid = await bcrypt.compare(pwd, admin.pwd);
    if (!isPasswordValid) {
      return res.status(401).json({ code: 401, message: '账号或密码错误' });
    }
    const token = jwt.sign(
      { admin_id: admin.admin_id, admin_name: admin.admin_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        admin_name: admin.admin_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
