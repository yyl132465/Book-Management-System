const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const categoryRoutes = require('./routes/categories');
const readerRoutes = require('./routes/readers');
const borrowRoutes = require('./routes/borrows');
const dashboardRoutes = require('./routes/dashboard');
const readerAuthRoutes = require('./routes/reader-auth');
const readerBorrowRoutes = require('./routes/reader-borrow');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', bookRoutes);
app.use('/api', categoryRoutes);
app.use('/api', readerRoutes);
app.use('/api', borrowRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', readerAuthRoutes);
app.use('/api', readerBorrowRoutes);

app.listen(PORT, () => {
  console.log(`BMS Backend running on http://localhost:${PORT}`);
});
