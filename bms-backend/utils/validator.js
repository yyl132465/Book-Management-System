function parsePagination(query) {
  let page = parseInt(query.page);
  let pageSize = parseInt(query.pageSize);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(pageSize) || pageSize < 1) pageSize = 10;
  if (pageSize > 100) pageSize = 100;

  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

function validatePhone(phone) {
  if (!phone) return true;
  return /^1[3-9]\d{9}$/.test(phone);
}

function validateReaderId(reader_id) {
  if (!reader_id) return false;
  return /^[a-zA-Z0-9]{4,20}$/.test(reader_id);
}

module.exports = { parsePagination, validatePhone, validateReaderId };
