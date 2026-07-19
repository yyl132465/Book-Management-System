function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isAppError = true;
  }
}

function errorHandler(err, req, res, next) {
  if (err.isAppError) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ code: 400, message: '数据已存在' });
  }

  console.error(err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
}

module.exports = { asyncHandler, AppError, errorHandler };
