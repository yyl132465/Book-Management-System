const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' });
  }
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.admin_id) {
      return res.status(401).json({ code: 401, message: 'Token 无效' });
    }
    req.admin = payload;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ code: 401, message: 'Token 无效' });
  }
}

function readerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' });
  }
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.reader_id) {
      return res.status(401).json({ code: 401, message: 'Token 无效' });
    }
    req.reader = payload;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ code: 401, message: 'Token 无效' });
  }
}

module.exports = { adminAuth, readerAuth, JWT_SECRET };