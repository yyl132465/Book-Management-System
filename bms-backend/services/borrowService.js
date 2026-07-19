const pool = require('../db');
const { AppError } = require('../middleware/errorHandler');

const BORROW_DAYS = 30;

async function borrowBook(conn, book_id, reader_id) {
  if (!book_id || !reader_id) {
    throw new AppError('请选择图书和读者', 400);
  }

  const [readers] = await conn.query('SELECT * FROM reader WHERE reader_id = ?', [reader_id]);
  if (readers.length === 0) {
    throw new AppError('读者不存在', 400);
  }
  const reader = readers[0];
  if (reader.status === 0) {
    throw new AppError('该读者账户已被禁用', 400);
  }

  const [borrowCount] = await conn.query(
    'SELECT COUNT(*) AS cnt FROM borrow WHERE reader_id = ? AND is_back = 0',
    [reader_id]
  );
  if (borrowCount[0].cnt >= reader.max_book) {
    throw new AppError(`该读者已达到最大借阅数量(${reader.max_book}本)`, 400);
  }

  const [books] = await conn.query('SELECT * FROM book WHERE book_id = ?', [book_id]);
  if (books.length === 0) {
    throw new AppError('图书不存在', 400);
  }
  const book = books[0];
  if (book.stock <= 0) {
    throw new AppError('该图书库存不足', 400);
  }

  const [dupCheck] = await conn.query(
    'SELECT COUNT(*) AS cnt FROM borrow WHERE book_id=? AND reader_id=? AND is_back=0',
    [book_id, reader_id]
  );
  if (dupCheck[0].cnt > 0) {
    throw new AppError('该读者已借阅此图书且尚未归还', 400);
  }

  const today = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + BORROW_DAYS * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);

  await conn.query(
    'INSERT INTO borrow (book_id, reader_id, borrow_time, due_date, over_day, is_back) VALUES (?, ?, ?, ?, 0, 0)',
    [book_id, reader_id, today, dueDate]
  );

  await conn.query('UPDATE book SET stock = stock - 1 WHERE book_id = ?', [book_id]);

  return { message: '借阅成功' };
}

async function returnBook(conn, borrow_id, reader_id = null) {
  const [records] = await conn.query('SELECT * FROM borrow WHERE borrow_id = ?', [borrow_id]);
  if (records.length === 0) {
    throw new AppError('借阅记录不存在', 400);
  }
  const record = records[0];

  if (reader_id !== null && record.reader_id !== reader_id) {
    throw new AppError('无权操作该借阅记录', 403);
  }

  if (record.is_back === 1) {
    throw new AppError('该记录已归还', 400);
  }

  const today = new Date().toISOString().slice(0, 10);
  let overDay = 0;
  if (record.due_date) {
    const due = new Date(record.due_date);
    const now = new Date(today);
    const diffMs = now - due;
    if (diffMs > 0) {
      overDay = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }
  }

  await conn.query(
    'UPDATE borrow SET is_back = 1, return_time = ?, over_day = ? WHERE borrow_id = ?',
    [today, overDay, borrow_id]
  );

  await conn.query('UPDATE book SET stock = stock + 1 WHERE book_id = ?', [record.book_id]);

  return { message: '还书成功', over_day: overDay };
}

const RENEW_DAYS = 30;
const MAX_RENEW = 2;

async function renewBook(conn, borrow_id, reader_id = null) {
  const [records] = await conn.query('SELECT * FROM borrow WHERE borrow_id = ?', [borrow_id]);
  if (records.length === 0) {
    throw new AppError('借阅记录不存在', 400);
  }
  const record = records[0];

  if (reader_id !== null && record.reader_id !== reader_id) {
    throw new AppError('无权操作该借阅记录', 403);
  }

  if (record.is_back === 1) {
    throw new AppError('该记录已归还，无法续借', 400);
  }

  const renewCount = record.renew_count || 0;
  if (renewCount >= MAX_RENEW) {
    throw new AppError(`已达到最大续借次数(${MAX_RENEW}次)`, 400);
  }

  const currentDue = record.due_date
    ? new Date(record.due_date)
    : new Date(record.borrow_time);
  const newDue = new Date(currentDue.getTime() + RENEW_DAYS * 24 * 60 * 60 * 1000);
  const newDueStr = newDue.toISOString().slice(0, 10);

  await conn.query(
    'UPDATE borrow SET due_date = ?, renew_count = ? WHERE borrow_id = ?',
    [newDueStr, renewCount + 1, borrow_id]
  );

  return { message: '续借成功', due_date: newDueStr, renew_count: renewCount + 1 };
}

module.exports = { borrowBook, returnBook, renewBook, BORROW_DAYS, RENEW_DAYS, MAX_RENEW };
